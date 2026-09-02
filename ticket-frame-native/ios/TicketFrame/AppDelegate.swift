import Expo
import React
import ReactAppDependencyProvider
import AppIntents

private enum TicketFrameSiriStore {
  static let enabledKey = "ticket-frame.siri-enabled.v1"
  static let snapshotKey = "ticket-frame.siri-snapshot.v1"
  static let pendingActionKey = "ticket-frame.siri-pending-action.v1"

  static var isEnabled: Bool {
    UserDefaults.standard.bool(forKey: enabledKey)
  }

  static func snapshot() -> [String: Any] {
    guard
      let data = UserDefaults.standard.data(forKey: snapshotKey),
      let value = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else { return [:] }
    return value
  }

  static func queue(_ action: [String: Any]) {
    guard let data = try? JSONSerialization.data(withJSONObject: action) else { return }
    UserDefaults.standard.set(data, forKey: pendingActionKey)
  }
}

@objc(SiriShortcutsModule)
class SiriShortcutsModule: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool { false }

  @objc func setEnabled(_ enabled: Bool) {
    UserDefaults.standard.set(enabled, forKey: TicketFrameSiriStore.enabledKey)
  }

  @objc func updateSnapshot(_ snapshot: NSDictionary) {
    guard JSONSerialization.isValidJSONObject(snapshot),
          let data = try? JSONSerialization.data(withJSONObject: snapshot)
    else { return }
    UserDefaults.standard.set(data, forKey: TicketFrameSiriStore.snapshotKey)
    if #available(iOS 16.0, *) {
      TicketFrameAppShortcuts.updateAppShortcutParameters()
    }
  }

  @objc func consumePendingAction(
    _ resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    let defaults = UserDefaults.standard
    guard let data = defaults.data(forKey: TicketFrameSiriStore.pendingActionKey) else {
      resolve(nil)
      return
    }
    defaults.removeObject(forKey: TicketFrameSiriStore.pendingActionKey)
    guard let value = try? JSONSerialization.jsonObject(with: data) else {
      resolve(nil)
      return
    }
    resolve(value)
  }
}

@available(iOS 16.0, *)
enum TicketFrameSection: String, AppEnum {
  case history
  case myClub
  case stadiums
  case fixtures

  static let typeDisplayRepresentation = TypeDisplayRepresentation(name: "Ticket Frame section")
  static let caseDisplayRepresentations: [TicketFrameSection: DisplayRepresentation] = [
    .history: "History",
    .myClub: "My Club",
    .stadiums: "Stadiums",
    .fixtures: "Fixtures",
  ]

  var tabName: String {
    switch self {
    case .history: return "history"
    case .myClub: return "club"
    case .stadiums: return "grounds"
    case .fixtures: return "fixtures"
    }
  }
}

@available(iOS 16.0, *)
struct TicketFrameTicketEntity: AppEntity {
  static let typeDisplayRepresentation = TypeDisplayRepresentation(name: "Ticket Frame ticket")
  static let defaultQuery = TicketFrameTicketQuery()

  let id: String
  let label: String
  let searchable: String

  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: "\(label)")
  }
}

@available(iOS 16.0, *)
struct TicketFrameTicketQuery: EntityStringQuery {
  private func all() -> [TicketFrameTicketEntity] {
    let rows = TicketFrameSiriStore.snapshot()["tickets"] as? [[String: Any]] ?? []
    return rows.compactMap { row in
      guard let id = row["id"] as? String else { return nil }
      return TicketFrameTicketEntity(
        id: id,
        label: row["label"] as? String ?? "Saved ticket",
        searchable: row["searchable"] as? String ?? ""
      )
    }
  }

  func entities(for identifiers: [String]) async throws -> [TicketFrameTicketEntity] {
    all().filter { identifiers.contains($0.id) }
  }

  func entities(matching string: String) async throws -> [TicketFrameTicketEntity] {
    let query = string.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: .current)
    return all().filter {
      $0.searchable.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: .current).contains(query)
    }
  }

  func suggestedEntities() async throws -> [TicketFrameTicketEntity] { all() }
}

@available(iOS 16.0, *)
struct TicketFrameMatchEntity: AppEntity {
  static let typeDisplayRepresentation = TypeDisplayRepresentation(name: "Ticket Frame game")
  static let defaultQuery = TicketFrameMatchQuery()

  let id: String
  let label: String
  let searchable: String

  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: "\(label)")
  }
}

@available(iOS 16.0, *)
struct TicketFrameMatchQuery: EntityStringQuery {
  private func all() -> [TicketFrameMatchEntity] {
    let rows = TicketFrameSiriStore.snapshot()["matches"] as? [[String: Any]] ?? []
    return rows.compactMap { row in
      guard let id = row["id"] as? String else { return nil }
      return TicketFrameMatchEntity(
        id: id,
        label: row["label"] as? String ?? "Saved game",
        searchable: row["searchable"] as? String ?? ""
      )
    }
  }

  func entities(for identifiers: [String]) async throws -> [TicketFrameMatchEntity] {
    all().filter { identifiers.contains($0.id) }
  }

  func entities(matching string: String) async throws -> [TicketFrameMatchEntity] {
    let query = string.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: .current)
    return all().filter {
      $0.searchable.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: .current).contains(query)
    }
  }

  func suggestedEntities() async throws -> [TicketFrameMatchEntity] { all() }
}

@available(iOS 16.0, *)
struct OpenTicketFrameSectionIntent: AppIntent {
  static let title: LocalizedStringResource = "Open Ticket Frame Section"
  static let description = IntentDescription("Opens History, My Club, Stadiums or Fixtures in Ticket Frame.")
  static var openAppWhenRun = true

  @Parameter(title: "Section") var section: TicketFrameSection

  func perform() async throws -> some IntentResult & ProvidesDialog {
    guard TicketFrameSiriStore.isEnabled else {
      return .result(dialog: "Siri access is off. You can turn it on in Ticket Frame Settings.")
    }
    TicketFrameSiriStore.queue(["type": "open", "tab": section.tabName])
    return .result(dialog: "Opening \(section.rawValue) in Ticket Frame.")
  }
}

@available(iOS 16.0, *)
struct FindTicketFrameTicketIntent: AppIntent {
  static let title: LocalizedStringResource = "Find a Ticket"
  static let description = IntentDescription("Finds a saved ticket by team or date.")
  static var openAppWhenRun = true

  @Parameter(title: "Ticket") var ticket: TicketFrameTicketEntity

  func perform() async throws -> some IntentResult & ProvidesDialog {
    guard TicketFrameSiriStore.isEnabled else {
      return .result(dialog: "Siri access is off. You can turn it on in Ticket Frame Settings.")
    }
    TicketFrameSiriStore.queue(["type": "ticket", "id": ticket.id])
    return .result(dialog: "Opening \(ticket.label) in Ticket Frame.")
  }
}

@available(iOS 16.0, *)
struct OpenTicketFrameMatchIntent: AppIntent {
  static let title: LocalizedStringResource = "Show a Game"
  static let description = IntentDescription("Opens a saved game in Match Memory by team or date.")
  static var openAppWhenRun = true

  @Parameter(title: "Game") var match: TicketFrameMatchEntity

  func perform() async throws -> some IntentResult & ProvidesDialog {
    guard TicketFrameSiriStore.isEnabled else {
      return .result(dialog: "Siri access is off. You can turn it on in Ticket Frame Settings.")
    }
    TicketFrameSiriStore.queue(["type": "memory", "id": match.id])
    return .result(dialog: "Opening \(match.label) in Match Memory.")
  }
}

@available(iOS 16.0, *)
struct OpenTicketFrameMatchPhotosIntent: AppIntent {
  static let title: LocalizedStringResource = "Show Game Photos"
  static let description = IntentDescription("Opens the saved photos for a game in Match Memory.")
  static var openAppWhenRun = true

  @Parameter(title: "Game") var match: TicketFrameMatchEntity

  func perform() async throws -> some IntentResult & ProvidesDialog {
    guard TicketFrameSiriStore.isEnabled else {
      return .result(dialog: "Siri access is off. You can turn it on in Ticket Frame Settings.")
    }
    TicketFrameSiriStore.queue(["type": "memory", "id": match.id])
    return .result(dialog: "Opening the photos for \(match.label).")
  }
}

@available(iOS 16.0, *)
struct UpcomingTicketFrameFixtureIntent: AppIntent {
  static let title: LocalizedStringResource = "Next Favourite Club Fixture"
  static let description = IntentDescription("Finds the next verified fixture for your favourite club.")
  static var openAppWhenRun = true

  func perform() async throws -> some IntentResult & ProvidesDialog {
    guard TicketFrameSiriStore.isEnabled else {
      return .result(dialog: "Siri access is off. You can turn it on in Ticket Frame Settings.")
    }
    guard let fixture = TicketFrameSiriStore.snapshot()["nextFixture"] as? [String: Any] else {
      return .result(dialog: "Ticket Frame does not have a verified upcoming fixture yet.")
    }
    TicketFrameSiriStore.queue(["type": "open", "tab": "fixtures"])
    let label = fixture["label"] as? String ?? "the next fixture"
    return .result(dialog: "\(label). Opening Fixtures in Ticket Frame.")
  }
}

@available(iOS 16.0, *)
struct NavigateTicketFrameStadiumIntent: AppIntent {
  static let title: LocalizedStringResource = "Navigate to a Stadium"
  static let description = IntentDescription("Finds a stadium by club or stadium name, then opens navigation choices in Ticket Frame.")
  static var openAppWhenRun = true

  @Parameter(title: "Club or stadium") var search: String

  func perform() async throws -> some IntentResult & ProvidesDialog {
    guard TicketFrameSiriStore.isEnabled else {
      return .result(dialog: "Siri access is off. You can turn it on in Ticket Frame Settings.")
    }
    let query = search.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: .current)
    let grounds = TicketFrameSiriStore.snapshot()["grounds"] as? [[String: Any]] ?? []
    let match = grounds.first { ground in
      let searchable = ground["searchable"] as? String ?? ""
      return searchable.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: .current).contains(query)
    }
    guard let match else {
      return .result(dialog: "I couldn't find a stadium matching \(search).")
    }
    TicketFrameSiriStore.queue([
      "type": "navigate",
      "name": match["name"] as? String ?? search,
      "latitude": match["latitude"] as? Double ?? 0,
      "longitude": match["longitude"] as? Double ?? 0,
    ])
    return .result(dialog: "Opening navigation choices for \(match["name"] as? String ?? search).")
  }
}

@available(iOS 16.0, *)
struct TicketFrameAppShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: OpenTicketFrameSectionIntent(),
      phrases: ["Open \(.applicationName)"],
      shortTitle: "Open Ticket Frame",
      systemImageName: "ticket"
    )
    AppShortcut(
      intent: FindTicketFrameTicketIntent(),
      phrases: [
        "Show me \(\.$ticket) in \(.applicationName)",
        "Show me a \(\.$ticket) ticket in \(.applicationName)",
      ],
      shortTitle: "Find Ticket",
      systemImageName: "ticket.fill"
    )
    AppShortcut(
      intent: OpenTicketFrameMatchIntent(),
      phrases: ["Show me the \(\.$match) game in \(.applicationName)"],
      shortTitle: "Show Game",
      systemImageName: "sportscourt.fill"
    )
    AppShortcut(
      intent: OpenTicketFrameMatchPhotosIntent(),
      phrases: ["Show me photos from the \(\.$match) game in \(.applicationName)"],
      shortTitle: "Show Game Photos",
      systemImageName: "photo.on.rectangle"
    )
    AppShortcut(
      intent: UpcomingTicketFrameFixtureIntent(),
      phrases: ["What's my next fixture in \(.applicationName)"],
      shortTitle: "Next Fixture",
      systemImageName: "calendar"
    )
    AppShortcut(
      intent: NavigateTicketFrameStadiumIntent(),
      phrases: ["Navigate to a stadium with \(.applicationName)"],
      shortTitle: "Navigate to Stadium",
      systemImageName: "location.fill"
    )
  }
}

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    bindReactNativeFactory(factory)

    if #available(iOS 16.0, *) {
      TicketFrameAppShortcuts.updateAppShortcutParameters()
    }

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // needed to return the correct URL for expo-dev-client.
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
