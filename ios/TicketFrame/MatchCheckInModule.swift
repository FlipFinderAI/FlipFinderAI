import CoreLocation
import UserNotifications
import React

// Native region monitoring has no continuous location session and needs no
// UIBackgroundModes/location. All state and callbacks live on the main queue.
final class MatchCheckInMonitor: NSObject, CLLocationManagerDelegate {
  static let shared = MatchCheckInMonitor()
  static let legacyTask = "ticket-frame-match-checkin-geofence.v1"
  static let prefix = "ticket-frame.checkin.native."
  private let defaults = UserDefaults.standard
  private let stateKey = "ticket-frame.native-checkin.v1"
  private let cleanupKey = "ticket-frame.legacy-checkin-regions.v1"
  private let manager = CLLocationManager()
  private let notifications = UNUserNotificationCenter.current()
  private var state: [String: Any] = [:]
  private var fixtures: [[String: Any]] { state["fixtures"] as? [[String: Any]] ?? [] }
  private var presence: [String: Any] {
    get { state["presence"] as? [String: Any] ?? [:] }
    set { state["presence"] = newValue }
  }
  private var acknowledgements: [String] {
    get { state["acknowledged"] as? [String] ?? [] }
    set { state["acknowledged"] = Array(newValue.suffix(100)) }
  }

  override private init() {
    super.init()
    if let data = defaults.data(forKey: stateKey),
       let saved = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
      state = saved
    }
    manager.delegate = self
  }

  private func save() {
    if let data = try? JSONSerialization.data(withJSONObject: state) {
      defaults.set(data, forKey: stateKey)
    }
  }

  // Called before constructing the Expo factory or invoking super's launch
  // callback. Expo SDK 57 restores EXTaskService's defaults in that callback.
  // Keep the region cleanup journal until JS has successfully configured the
  // replacement, including if the process is interrupted during migration.
  func prepareForLaunch() {
    var config = defaults.dictionary(forKey: "EXTaskService") ?? [:]
    var legacyIDs = Set(defaults.stringArray(forKey: cleanupKey) ?? [])
    var changed = false
    for appID in Array(config.keys) {
      guard var app = config[appID] as? [String: Any],
            var tasks = app["tasks"] as? [String: Any],
            let old = tasks.removeValue(forKey: Self.legacyTask) as? [String: Any] else { continue }
      let options = old["options"] as? [String: Any] ?? [:]
      for region in options["regions"] as? [[String: Any]] ?? [] {
        if let id = region["identifier"] as? String { legacyIDs.insert(id) }
      }
      app["tasks"] = tasks
      config[appID] = app
      changed = true
    }
    if changed {
      defaults.set(Array(legacyIDs), forKey: cleanupKey)
      defaults.set(config, forKey: "EXTaskService")
      defaults.synchronize()
    }
    for region in manager.monitoredRegions where legacyIDs.contains(region.identifier) {
      manager.stopMonitoring(for: region)
    }
    reconcileRegions()
  }

  func migrate(_ snapshot: [String: Any]) {
    guard state["migrated"] as? Bool != true else { return }
    state = snapshot
    state["migrated"] = true
    save()
    reconcileRegions()
  }

  func configure(_ rows: [[String: Any]]) throws {
    guard CLLocationManager.isMonitoringAvailable(for: CLCircularRegion.self),
          CLLocationManager.locationServicesEnabled(), manager.authorizationStatus == .authorizedAlways else {
      throw NSError(domain: "MatchCheckIn", code: 1, userInfo: [NSLocalizedDescriptionKey:
        "Allow Always location access and Location Services for automatic match check-ins."])
    }
    let valid = rows.filter { row in
      guard let lat = row["latitude"] as? Double, let lon = row["longitude"] as? Double,
            let kickoff = row["kickoffMs"] as? Double, kickoff.isFinite,
            let key = row["key"] as? String, !key.isEmpty else { return false }
      return CLLocationCoordinate2DIsValid(CLLocationCoordinate2D(latitude: lat, longitude: lon))
    }
    guard valid.count == rows.count, rows.count <= 20,
          Set(rows.compactMap { $0["key"] as? String }).count == rows.count else {
      throw NSError(domain: "MatchCheckIn", code: 2, userInfo: [NSLocalizedDescriptionKey: "Invalid stadium regions."])
    }
    let keys = Set(rows.compactMap { $0["key"] as? String })
    for old in fixtures {
      if let key = old["key"] as? String, !keys.contains(key) { cancel(key); presence.removeValue(forKey: key) }
    }
    state["fixtures"] = rows
    state["enabled"] = true
    save() // Persist event lookup before Core Location can deliver a callback.
    reconcileRegions()
    defaults.removeObject(forKey: cleanupKey)
  }

  func disable() {
    state["enabled"] = false
    for fixture in fixtures { if let key = fixture["key"] as? String { cancel(key) } }
    state["fixtures"] = []
    presence = [:]
    save()
    reconcileRegions()
  }

  private func reconcileRegions() {
    let now = Date().timeIntervalSince1970 * 1000
    let active = state["enabled"] as? Bool == true ? Array(fixtures.filter {
      guard let key = $0["key"] as? String, let kickoff = $0["kickoffMs"] as? Double else { return false }
      guard kickoff.isFinite, let lat = $0["latitude"] as? Double, let lon = $0["longitude"] as? Double,
            CLLocationCoordinate2DIsValid(CLLocationCoordinate2D(latitude: lat, longitude: lon)) else { return false }
      return !acknowledgements.contains(key) && now <= kickoff + 10800000
    }.prefix(20)) : []
    let desired = Set(active.compactMap { ($0["key"] as? String).map { Self.prefix + $0 } })
    for region in manager.monitoredRegions where region.identifier.hasPrefix(Self.prefix) && !desired.contains(region.identifier) {
      manager.stopMonitoring(for: region)
    }
    guard manager.authorizationStatus == .authorizedAlways else { return }
    let unrelated = manager.monitoredRegions.filter { !$0.identifier.hasPrefix(Self.prefix) }.count
    for fixture in active.prefix(max(0, 20 - unrelated)) {
      guard let key = fixture["key"] as? String, let lat = fixture["latitude"] as? Double,
            let lon = fixture["longitude"] as? Double else { continue }
      let region = CLCircularRegion(center: CLLocationCoordinate2D(latitude: lat, longitude: lon),
                                    radius: 500, identifier: Self.prefix + key)
      region.notifyOnEntry = true
      region.notifyOnExit = true
      let existing = manager.monitoredRegions.first { $0.identifier == region.identifier } as? CLCircularRegion
      if existing?.radius != 500 || existing?.center.latitude != lat || existing?.center.longitude != lon {
        manager.startMonitoring(for: region)
      }
      manager.requestState(for: region)
    }
  }

  func acknowledge(_ key: String) {
    if !acknowledgements.contains(key) { acknowledgements.append(key) }
    cancel(key)
    presence.removeValue(forKey: key)
    save()
    reconcileRegions()
  }

  func cancel(_ key: String) {
    let legacy = state["reminders"] as? [String: [String]] ?? [:]
    notifications.removePendingNotificationRequests(withIdentifiers: notificationIDs(key) + (legacy[key] ?? []))
    var reminders = legacy
    reminders.removeValue(forKey: key)
    state["reminders"] = reminders
    save()
  }

  func record(_ fixture: [String: Any]) {
    guard let key = fixture["key"] as? String else { return }
    var item = presence[key] as? [String: Any] ?? [:]
    item["fixture"] = fixture
    item["detectedAt"] = ISO8601DateFormatter().string(from: Date())
    item["tentative"] = false
    presence[key] = item
    save()
  }

  func unresolved() -> [[String: Any]] {
    let now = Date().timeIntervalSince1970 * 1000
    return presence.compactMap { key, value in
      guard !acknowledgements.contains(key), let item = value as? [String: Any],
            let fixture = item["fixture"] as? [String: Any], let kickoff = fixture["kickoffMs"] as? Double,
            now >= kickoff - 3600000, now <= kickoff + 10800000 else { return nil }
      return fixture
    }
  }

  private func notificationIDs(_ key: String) -> [String] { (0...2).map { Self.prefix + key + ".\($0)" } }

  private func event(_ region: CLRegion, inside: Bool) {
    guard region.identifier.hasPrefix(Self.prefix), state["enabled"] as? Bool == true else { return }
    let key = String(region.identifier.dropFirst(Self.prefix.count))
    guard let fixture = fixtures.first(where: { $0["key"] as? String == key }) else { return }
    if !inside {
      cancel(key)
      presence.removeValue(forKey: key)
      save()
      return
    }
    guard !acknowledgements.contains(key), let kickoff = fixture["kickoffMs"] as? Double else { return }
    let now = Date().timeIntervalSince1970 * 1000
    guard now <= kickoff + 10800000 else { return }
    let previous = presence[key] as? [String: Any] ?? [:]
    // Persisted state suppresses duplicate region callbacks across launches.
    if previous["scheduled"] as? Bool == true { return }
    let legacy = state["reminders"] as? [String: [String]] ?? [:]
    if !(legacy[key] ?? []).isEmpty { return }
    var item = previous
    item["fixture"] = fixture
    item["detectedAt"] = previous["detectedAt"] ?? ISO8601DateFormatter().string(from: Date())
    item["tentative"] = now < kickoff - 3600000
    item["scheduled"] = true
    presence[key] = item
    save()
    let times = [max(now, kickoff - 3600000), kickoff + 6840000, kickoff + 10440000]
    let ids = notificationIDs(key)
    for (index, time) in times.enumerated() {
      if index > 0 && time <= now { continue }
      if index == 0 && previous["notifiedAt"] != nil { continue }
      let home = fixture[fixture["homeAway"] as? String == "home" ? "club" : "opponent"] as? String ?? ""
      let away = fixture[fixture["homeAway"] as? String == "home" ? "opponent" : "club"] as? String ?? ""
      let match = "\(home) v \(away)"
      let content = UNMutableNotificationContent()
      content.title = time < kickoff ? "Are you attending the fixture between \(match)?" :
        time <= kickoff + 10800000 ? "Are you at the fixture between \(match)?" : "Did you attend the fixture between \(match)?"
      content.body = match
      content.categoryIdentifier = "MATCH_ATTENDANCE"
      // Expo SDK 57 exposes local userInfo directly as content.data.
      content.userInfo = ["matchCheckIn": fixture]
      let trigger: UNNotificationTrigger? = time <= now ? nil : UNTimeIntervalNotificationTrigger(timeInterval: (time - now) / 1000, repeats: false)
      notifications.add(UNNotificationRequest(identifier: ids[index], content: content, trigger: trigger)) { error in
        if let error {
          NSLog("[match-check-in] Notification scheduling failed: %@", error.localizedDescription)
          DispatchQueue.main.async {
            var failed = self.presence[key] as? [String: Any] ?? [:]
            failed["scheduled"] = false
            self.presence[key] = failed
            self.save()
          }
        }
      }
    }
  }

  func locationManager(_ manager: CLLocationManager, didEnterRegion region: CLRegion) { event(region, inside: true) }
  func locationManager(_ manager: CLLocationManager, didExitRegion region: CLRegion) { event(region, inside: false) }
  func locationManager(_ manager: CLLocationManager, didDetermineState state: CLRegionState, for region: CLRegion) {
    if state != .unknown { event(region, inside: state == .inside) }
  }
  func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) { reconcileRegions() }
  func locationManager(_ manager: CLLocationManager, monitoringDidFailFor region: CLRegion?, withError error: Error) {
    NSLog("[match-check-in] Region monitoring failed: %@", error.localizedDescription)
  }
}

@objc(MatchCheckInModule)
class MatchCheckInModule: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool { true }
  @objc var methodQueue: DispatchQueue { DispatchQueue.main }

  @objc func migrate(_ snapshot: NSDictionary, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    MatchCheckInMonitor.shared.migrate(snapshot as? [String: Any] ?? [:]); resolve(nil)
  }
  @objc func configure(_ fixtures: NSArray, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    do { try MatchCheckInMonitor.shared.configure(fixtures as? [[String: Any]] ?? []); resolve(nil) }
    catch { reject("CHECKIN_REGIONS", error.localizedDescription, error) }
  }
  @objc func disable(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    MatchCheckInMonitor.shared.disable(); resolve(nil)
  }
  @objc func acknowledge(_ key: String, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    MatchCheckInMonitor.shared.acknowledge(key); resolve(nil)
  }
  @objc func cancel(_ key: String, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    MatchCheckInMonitor.shared.cancel(key); resolve(nil)
  }
  @objc func record(_ fixture: NSDictionary, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    MatchCheckInMonitor.shared.record(fixture as? [String: Any] ?? [:]); resolve(nil)
  }
  @objc func unresolved(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    resolve(MatchCheckInMonitor.shared.unresolved())
  }
}
