import Foundation
import MapKit
import React
import UIKit

@objc(ParkingSearchModule)
final class ParkingSearchModule: NSObject {
  @objc(searchPlacesQuery:longitude:kind:query:resolver:rejecter:)
  func searchPlacesQuery(
    _ latitude: NSNumber,
    longitude: NSNumber,
    kind: NSString,
    query: NSString,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let origin = CLLocationCoordinate2D(latitude: latitude.doubleValue, longitude: longitude.doubleValue)
    let request = MKLocalSearch.Request()
    let cleaned = query.trimmingCharacters(in: .whitespacesAndNewlines)
    let defaultQuery: String
    switch kind as String {
    case "pub":
      defaultQuery = "pub bar"
    case "stadium":
      defaultQuery = "football stadium"
    default:
      defaultQuery = "restaurant"
    }
    request.naturalLanguageQuery = cleaned.isEmpty ? defaultQuery : cleaned
    request.resultTypes = .pointOfInterest
    request.region = MKCoordinateRegion(center: origin, latitudinalMeters: 50_000, longitudinalMeters: 50_000)

    MKLocalSearch(request: request).start { response, error in
      guard error == nil, let items = response?.mapItems else {
        reject("place_query_failed", "Apple Maps could not search for that place.", error)
        return
      }
      let originLocation = CLLocation(latitude: origin.latitude, longitude: origin.longitude)
      let results = items.map { item -> [String: Any] in
        let coordinate = item.placemark.coordinate
        let metres = originLocation.distance(from: CLLocation(latitude: coordinate.latitude, longitude: coordinate.longitude))
        let address = [item.placemark.subThoroughfare, item.placemark.thoroughfare, item.placemark.locality]
          .compactMap { $0 }.joined(separator: " ")
        return [
          "id": "apple-\(item.name ?? "place")-\(coordinate.latitude)-\(coordinate.longitude)",
          "name": item.name ?? cleaned,
          "address": address,
          "latitude": coordinate.latitude,
          "longitude": coordinate.longitude,
          "distanceMiles": metres / 1609.344,
        ]
      }
      .sorted { (($0["distanceMiles"] as? Double) ?? .greatestFiniteMagnitude) < (($1["distanceMiles"] as? Double) ?? .greatestFiniteMagnitude) }
      .prefix(5)
      resolve(Array(results))
    }
  }

  @objc(pickCoordinate:longitude:resolver:rejecter:)
  func pickCoordinate(
    _ latitude: NSNumber,
    longitude: NSNumber,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      guard let presenter = HistoryPlaceSearchViewController.topViewController()
      else {
        reject(
          "coordinate_picker_unavailable",
          "Ticket Frame could not open the car park map.",
          nil
        )
        return
      }

      let picker = HistoryCoordinatePickerViewController(
        latitude: latitude.doubleValue,
        longitude: longitude.doubleValue
      )

      picker.onComplete = { result in
        if let result {
          resolve(result)
        } else {
          resolve(NSNull())
        }
      }

      let navigation = UINavigationController(rootViewController: picker)
      navigation.modalPresentationStyle = .pageSheet
      presenter.present(navigation, animated: true)
    }
  }

  @objc(pickPlace:longitude:resolver:rejecter:)
  func pickPlace(
    _ latitude: NSNumber,
    longitude: NSNumber,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      guard let presenter = HistoryPlaceSearchViewController.topViewController()
      else {
        reject(
          "place_picker_unavailable",
          "Ticket Frame could not open the place picker.",
          nil
        )
        return
      }

      let picker = HistoryPlaceSearchViewController(
        latitude: latitude.doubleValue,
        longitude: longitude.doubleValue
      )

      picker.onComplete = { result in
        if let result {
          resolve(result)
        } else {
          resolve(NSNull())
        }
      }

      let navigation = UINavigationController(rootViewController: picker)
      navigation.modalPresentationStyle = .pageSheet
      presenter.present(navigation, animated: true)
    }
  }

  @objc(searchPlaces:longitude:kind:resolver:rejecter:)
  func searchPlaces(
    _ latitude: NSNumber,
    longitude: NSNumber,
    kind: NSString,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let origin = CLLocationCoordinate2D(latitude: latitude.doubleValue, longitude: longitude.doubleValue)
    let request = MKLocalSearch.Request()
    let searchKind = kind as String
    switch searchKind {
    case "pub":
      request.naturalLanguageQuery = "pub bar"
    case "stadium":
      request.naturalLanguageQuery = "football stadium"
    case "station":
      request.naturalLanguageQuery = "railway train station"
    case "metro":
      request.naturalLanguageQuery = "metro subway underground tube station"
    default:
      request.naturalLanguageQuery = "restaurant"
    }
    request.resultTypes = .pointOfInterest
    request.region = MKCoordinateRegion(
      center: origin,
      latitudinalMeters: 2_500,
      longitudinalMeters: 2_500
    )

    MKLocalSearch(request: request).start { response, error in
      guard error == nil, let items = response?.mapItems else {
        reject("place_search_failed", "Apple Maps could not load nearby places.", error)
        return
      }
      let originLocation = CLLocation(latitude: origin.latitude, longitude: origin.longitude)
      let results = items
        .map { item -> [String: Any] in
          let coordinate = item.placemark.coordinate
          let metres = originLocation.distance(from: CLLocation(latitude: coordinate.latitude, longitude: coordinate.longitude))
          return [
            "id": "apple-\(item.name ?? "place")-\(coordinate.latitude)-\(coordinate.longitude)",
            "name": item.name ?? (
              searchKind == "pub"
                ? "Nearby pub or bar"
                : searchKind == "stadium"
                  ? "Nearby stadium"
                  : searchKind == "station"
                    ? "Nearby railway station"
                    : searchKind == "metro"
                      ? "Nearby metro or Tube station"
                      : "Nearby restaurant"
            ),
            "latitude": coordinate.latitude,
            "longitude": coordinate.longitude,
            "distanceMiles": metres / 1609.344,
          ]
        }
        .filter { (($0["distanceMiles"] as? Double) ?? .greatestFiniteMagnitude) <= 0.75 }
        .sorted { (($0["distanceMiles"] as? Double) ?? .greatestFiniteMagnitude) < (($1["distanceMiles"] as? Double) ?? .greatestFiniteMagnitude) }
        .prefix(5)
      resolve(Array(results))
    }
  }

  @objc(search:longitude:resolver:rejecter:)
  func search(
    _ latitude: NSNumber,
    longitude: NSNumber,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let stadium = CLLocationCoordinate2D(latitude: latitude.doubleValue, longitude: longitude.doubleValue)
    let request = MKLocalSearch.Request()
    request.naturalLanguageQuery = "car park"
    request.resultTypes = .pointOfInterest
    request.region = MKCoordinateRegion(
      center: stadium,
      latitudinalMeters: 6_000,
      longitudinalMeters: 6_000
    )

    MKLocalSearch(request: request).start { response, error in
      guard error == nil, let items = response?.mapItems else {
        reject("parking_search_failed", "Apple Maps could not load nearby car parks.", error)
        return
      }

      let stadiumLocation = CLLocation(latitude: stadium.latitude, longitude: stadium.longitude)
      let nearest = items
        .map { item -> (MKMapItem, CLLocationDistance) in
          let coordinate = item.placemark.coordinate
          let distance = stadiumLocation.distance(from: CLLocation(latitude: coordinate.latitude, longitude: coordinate.longitude))
          return (item, distance)
        }
        .filter { $0.1 <= 5_000 }
        .sorted { $0.1 < $1.1 }
        .prefix(3)

      guard !nearest.isEmpty else {
        reject("no_parking_found", "Apple Maps found no nearby car parks.", nil)
        return
      }

      let group = DispatchGroup()
      let lock = NSLock()
      var results: [[String: Any]] = []

      for (index, entry) in nearest.enumerated() {
        group.enter()
        let item = entry.0
        let coordinate = item.placemark.coordinate
        let options = MKMapSnapshotter.Options()
        options.region = MKCoordinateRegion(
          center: coordinate,
          latitudinalMeters: 700,
          longitudinalMeters: 700
        )
        options.size = CGSize(width: 640, height: 300)
        options.scale = UIScreen.main.scale
        options.mapType = .standard

        MKMapSnapshotter(options: options).start(with: DispatchQueue.global(qos: .utility)) { snapshot, _ in
          var previewURI: String? = nil
          if let snapshot = snapshot {
            let image = ParkingSearchModule.markedImage(snapshot: snapshot, coordinate: coordinate)
            if let data = image.pngData() {
              let url = FileManager.default.temporaryDirectory
                .appendingPathComponent("ticket-frame-parking-\(Int(latitude.doubleValue * 10000))-\(Int(longitude.doubleValue * 10000))-\(index).png")
              try? data.write(to: url, options: .atomic)
              previewURI = url.absoluteString
            }
          }

          let result: [String: Any] = [
            "id": "\(item.name ?? "car-park")-\(coordinate.latitude)-\(coordinate.longitude)",
            "name": item.name ?? "Nearby car park",
            "latitude": coordinate.latitude,
            "longitude": coordinate.longitude,
            "distanceMiles": entry.1 / 1609.344,
            "previewUri": previewURI ?? NSNull()
          ]
          lock.lock()
          results.append(result)
          lock.unlock()
          group.leave()
        }
      }

      group.notify(queue: .main) {
        let sorted = results.sorted {
          (($0["distanceMiles"] as? Double) ?? .greatestFiniteMagnitude) <
            (($1["distanceMiles"] as? Double) ?? .greatestFiniteMagnitude)
        }
        resolve(sorted)
      }
    }
  }

  private static func markedImage(snapshot: MKMapSnapshotter.Snapshot, coordinate: CLLocationCoordinate2D) -> UIImage {
    let renderer = UIGraphicsImageRenderer(size: snapshot.image.size)
    return renderer.image { context in
      snapshot.image.draw(at: .zero)
      let point = snapshot.point(for: coordinate)
      let circle = CGRect(x: point.x - 12, y: point.y - 12, width: 24, height: 24)
      UIColor.systemBlue.setFill()
      context.cgContext.fillEllipse(in: circle)
      UIColor.white.setStroke()
      context.cgContext.setLineWidth(4)
      context.cgContext.strokeEllipse(in: circle.insetBy(dx: 2, dy: 2))
    }
  }
}

final class HistoryPlaceSearchViewController:
  UIViewController,
  UISearchBarDelegate,
  UITableViewDataSource,
  UITableViewDelegate
{
  var onComplete: (([String: Any]?) -> Void)?

  private let origin: CLLocationCoordinate2D
  private let searchBar = UISearchBar()
  private let tableView = UITableView(frame: .zero, style: .plain)
  private let statusLabel = UILabel()
  private var results: [MKMapItem] = []
  private var searchWorkItem: DispatchWorkItem?
  private var activeSearches: [MKLocalSearch] = []

  init(latitude: Double, longitude: Double) {
    self.origin = CLLocationCoordinate2D(
      latitude: latitude,
      longitude: longitude
    )
    super.init(nibName: nil, bundle: nil)
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func viewDidLoad() {
    super.viewDidLoad()

    title = "Find a location"
    view.backgroundColor = .systemBackground

    navigationItem.leftBarButtonItem = UIBarButtonItem(
      barButtonSystemItem: .cancel,
      target: self,
      action: #selector(cancel)
    )

    searchBar.placeholder = "Search place or location"
    searchBar.autocapitalizationType = .words
    searchBar.delegate = self

    statusLabel.text = "Nearby places"
    statusLabel.font = .preferredFont(forTextStyle: .subheadline)
    statusLabel.textColor = .secondaryLabel
    statusLabel.numberOfLines = 0

    tableView.dataSource = self
    tableView.delegate = self
    tableView.keyboardDismissMode = .onDrag

    [searchBar, statusLabel, tableView].forEach {
      $0.translatesAutoresizingMaskIntoConstraints = false
      view.addSubview($0)
    }

    NSLayoutConstraint.activate([
      searchBar.topAnchor.constraint(
        equalTo: view.safeAreaLayoutGuide.topAnchor
      ),
      searchBar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
      searchBar.trailingAnchor.constraint(equalTo: view.trailingAnchor),

      statusLabel.topAnchor.constraint(
        equalTo: searchBar.bottomAnchor,
        constant: 4
      ),
      statusLabel.leadingAnchor.constraint(
        equalTo: view.leadingAnchor,
        constant: 16
      ),
      statusLabel.trailingAnchor.constraint(
        equalTo: view.trailingAnchor,
        constant: -16
      ),

      tableView.topAnchor.constraint(
        equalTo: statusLabel.bottomAnchor,
        constant: 6
      ),
      tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
      tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
      tableView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
    ])

    loadNearbySuggestions()
  }

  @objc private func cancel() {
    dismiss(animated: true) {
      self.onComplete?(nil)
    }
  }

  func searchBar(
    _ searchBar: UISearchBar,
    textDidChange searchText: String
  ) {
    searchWorkItem?.cancel()

    let cleaned = searchText.trimmingCharacters(
      in: .whitespacesAndNewlines
    )

    guard cleaned.count >= 2 else {
      statusLabel.text = "Nearby places"
      loadNearbySuggestions()
      return
    }

    statusLabel.text = "Searching Apple Maps…"

    let item = DispatchWorkItem { [weak self] in
      self?.runSearch(query: cleaned)
    }

    searchWorkItem = item

    DispatchQueue.main.asyncAfter(
      deadline: .now() + 0.30,
      execute: item
    )
  }

  private func runSearch(query: String) {
    activeSearches.forEach { $0.cancel() }
    activeSearches.removeAll()

    let request = MKLocalSearch.Request()
    request.naturalLanguageQuery = query
    request.resultTypes = [.pointOfInterest, .address]
    request.region = MKCoordinateRegion(
      center: origin,
      latitudinalMeters: 50_000,
      longitudinalMeters: 50_000
    )

    let search = MKLocalSearch(request: request)
    activeSearches = [search]

    search.start { [weak self] response, _ in
      guard let self else { return }

      DispatchQueue.main.async {
        self.results = Array((response?.mapItems ?? []).prefix(12))
        self.statusLabel.text = self.results.isEmpty
          ? "No matching places found"
          : "Search results"
        self.tableView.reloadData()
      }
    }
  }

  private func loadNearbySuggestions() {
    activeSearches.forEach { $0.cancel() }
    activeSearches.removeAll()

    let queries = [
      "pub",
      "restaurant",
      "cafe",
      "hotel",
      "train station",
      "shop",
    ]

    let group = DispatchGroup()
    let lock = NSLock()
    var found: [MKMapItem] = []

    for query in queries {
      let request = MKLocalSearch.Request()
      request.naturalLanguageQuery = query
      request.resultTypes = .pointOfInterest
      request.region = MKCoordinateRegion(
        center: origin,
        latitudinalMeters: 4_000,
        longitudinalMeters: 4_000
      )

      let search = MKLocalSearch(request: request)
      activeSearches.append(search)

      group.enter()

      search.start { response, _ in
        lock.lock()
        found.append(contentsOf: response?.mapItems ?? [])
        lock.unlock()
        group.leave()
      }
    }

    group.notify(queue: .main) { [weak self] in
      guard let self else { return }

      let originLocation = CLLocation(
        latitude: self.origin.latitude,
        longitude: self.origin.longitude
      )

      var seen = Set<String>()

      self.results = found
        .sorted {
          let left = originLocation.distance(
            from: CLLocation(
              latitude: $0.placemark.coordinate.latitude,
              longitude: $0.placemark.coordinate.longitude
            )
          )
          let right = originLocation.distance(
            from: CLLocation(
              latitude: $1.placemark.coordinate.latitude,
              longitude: $1.placemark.coordinate.longitude
            )
          )
          return left < right
        }
        .filter { item in
          let coordinate = item.placemark.coordinate
          let key = [
            item.name ?? "",
            String(format: "%.5f", coordinate.latitude),
            String(format: "%.5f", coordinate.longitude),
          ].joined(separator: "|")

          if seen.contains(key) {
            return false
          }

          seen.insert(key)
          return true
        }

      self.results = Array(self.results.prefix(12))
      self.statusLabel.text = "Nearby places"
      self.tableView.reloadData()
    }
  }

  func tableView(
    _ tableView: UITableView,
    numberOfRowsInSection section: Int
  ) -> Int {
    results.count
  }

  func tableView(
    _ tableView: UITableView,
    cellForRowAt indexPath: IndexPath
  ) -> UITableViewCell {
    let cell = UITableViewCell(
      style: .subtitle,
      reuseIdentifier: nil
    )

    let item = results[indexPath.row]
    let coordinate = item.placemark.coordinate

    cell.textLabel?.text = item.name ?? "Location"

    let address = [
      item.placemark.subThoroughfare,
      item.placemark.thoroughfare,
      item.placemark.locality,
    ]
      .compactMap { $0 }
      .joined(separator: " ")

    let distance = CLLocation(
      latitude: origin.latitude,
      longitude: origin.longitude
    ).distance(
      from: CLLocation(
        latitude: coordinate.latitude,
        longitude: coordinate.longitude
      )
    ) / 1609.344

    if address.isEmpty {
      cell.detailTextLabel?.text = String(
        format: "%.2f mi away",
        distance
      )
    } else {
      cell.detailTextLabel?.text = String(
        format: "%@ · %.2f mi",
        address,
        distance
      )
    }

    cell.accessoryType = .disclosureIndicator
    return cell
  }

  func tableView(
    _ tableView: UITableView,
    didSelectRowAt indexPath: IndexPath
  ) {
    let item = results[indexPath.row]
    let coordinate = item.placemark.coordinate

    dismiss(animated: true) {
      self.onComplete?([
        "name": item.name ?? "Location",
        "latitude": coordinate.latitude,
        "longitude": coordinate.longitude,
      ])
    }
  }

  static func topViewController(
    base: UIViewController? = {
      let scene = UIApplication.shared.connectedScenes
        .compactMap { $0 as? UIWindowScene }
        .first { $0.activationState == .foregroundActive }

      return scene?.windows
        .first { $0.isKeyWindow }?
        .rootViewController
    }()
  ) -> UIViewController? {
    if let navigation = base as? UINavigationController {
      return topViewController(base: navigation.visibleViewController)
    }

    if let tab = base as? UITabBarController {
      return topViewController(base: tab.selectedViewController)
    }

    if let presented = base?.presentedViewController {
      return topViewController(base: presented)
    }

    return base
  }
}

private final class HistoryStadiumAnnotation:
  NSObject,
  MKAnnotation
{
  let coordinate: CLLocationCoordinate2D
  let stadiumName: String
  let clubName: String
  let visits: Int

  var title: String? {
    stadiumName
  }

  var subtitle: String? {
    let visitText = visits == 1 ? "1 visit" : "\(visits) visits"

    if clubName.isEmpty {
      return visitText
    }

    return "\(clubName) · \(visitText)"
  }

  init(
    coordinate: CLLocationCoordinate2D,
    stadiumName: String,
    clubName: String,
    visits: Int
  ) {
    self.coordinate = coordinate
    self.stadiumName = stadiumName
    self.clubName = clubName
    self.visits = visits
    super.init()
  }
}

final class HistoryCoordinatePickerViewController: UIViewController {
  var onComplete: (([String: Any]?) -> Void)?

  private let mapView = MKMapView(frame: .zero)
  private var completed = false

  private let initialCoordinate: CLLocationCoordinate2D

  init(latitude: Double, longitude: Double) {
    self.initialCoordinate = CLLocationCoordinate2D(
      latitude: latitude,
      longitude: longitude
    )
    super.init(nibName: nil, bundle: nil)
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func viewDidLoad() {
    super.viewDidLoad()

    title = "Drop Car Park Pin"
    view.backgroundColor = .systemBackground

    navigationItem.leftBarButtonItem = UIBarButtonItem(
      barButtonSystemItem: .cancel,
      target: self,
      action: #selector(cancelPicker)
    )

    navigationItem.rightBarButtonItem = UIBarButtonItem(
      title: "Confirm",
      style: .done,
      target: self,
      action: #selector(confirmPicker)
    )

    let mapTypeControl = UISegmentedControl(
      items: ["Standard", "Satellite", "Hybrid"]
    )
    mapTypeControl.selectedSegmentIndex = 2
    mapTypeControl.translatesAutoresizingMaskIntoConstraints = false
    mapTypeControl.addTarget(
      self,
      action: #selector(mapTypeChanged(_:)),
      for: .valueChanged
    )
    view.addSubview(mapTypeControl)

    mapView.mapType = .hybrid
    mapView.translatesAutoresizingMaskIntoConstraints = false
    mapView.showsUserLocation = true
    view.addSubview(mapView)

    NSLayoutConstraint.activate([
      mapTypeControl.topAnchor.constraint(
        equalTo: view.safeAreaLayoutGuide.topAnchor,
        constant: 8
      ),
      mapTypeControl.leadingAnchor.constraint(
        equalTo: view.leadingAnchor,
        constant: 16
      ),
      mapTypeControl.trailingAnchor.constraint(
        equalTo: view.trailingAnchor,
        constant: -16
      ),

      mapView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
      mapView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
      mapView.topAnchor.constraint(
        equalTo: mapTypeControl.bottomAnchor,
        constant: 8
      ),
      mapView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
    ])

    let region = MKCoordinateRegion(
      center: initialCoordinate,
      latitudinalMeters: 1200,
      longitudinalMeters: 1200
    )
    mapView.setRegion(region, animated: false)

    let pin = UIImageView(image: UIImage(systemName: "mappin.circle.fill"))
    pin.tintColor = .systemRed
    pin.contentMode = .scaleAspectFit
    pin.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(pin)

    NSLayoutConstraint.activate([
      pin.centerXAnchor.constraint(equalTo: mapView.centerXAnchor),
      pin.centerYAnchor.constraint(
        equalTo: mapView.centerYAnchor,
        constant: -16
      ),
      pin.widthAnchor.constraint(equalToConstant: 38),
      pin.heightAnchor.constraint(equalToConstant: 38),
    ])

    let instruction = UILabel()
    instruction.text = "Move the map so the pin marks where you parked"
    instruction.font = .systemFont(ofSize: 14, weight: .semibold)
    instruction.textAlignment = .center
    instruction.numberOfLines = 0
    instruction.backgroundColor = UIColor.systemBackground.withAlphaComponent(0.9)
    instruction.layer.cornerRadius = 10
    instruction.layer.masksToBounds = true
    instruction.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(instruction)

    NSLayoutConstraint.activate([
      instruction.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
      instruction.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
      instruction.bottomAnchor.constraint(
        equalTo: view.safeAreaLayoutGuide.bottomAnchor,
        constant: -18
      ),
      instruction.heightAnchor.constraint(greaterThanOrEqualToConstant: 44),
    ])
  }

  @objc private func mapTypeChanged(_ sender: UISegmentedControl) {
    switch sender.selectedSegmentIndex {
    case 0:
      mapView.mapType = .standard
    case 1:
      mapView.mapType = .satellite
    default:
      mapView.mapType = .hybrid
    }
  }

  @objc private func cancelPicker() {
    finish(nil)
  }

  @objc private func confirmPicker() {
    let coordinate = mapView.centerCoordinate

    finish([
      "latitude": coordinate.latitude,
      "longitude": coordinate.longitude,
    ])
  }

  private func finish(_ result: [String: Any]?) {
    guard !completed else { return }
    completed = true
    dismiss(animated: true) { [weak self] in
      self?.onComplete?(result)
    }
  }
}

@objc(HistoryStadiumMapView)
final class HistoryStadiumMapView:
  UIView,
  MKMapViewDelegate
{
  private let mapView = MKMapView(frame: .zero)

  @objc var stadiums: NSArray = [] {
    didSet {
      updateAnnotations()
    }
  }

  @objc var mapType: NSString = "standard" {
    didSet {
      switch mapType as String {
      case "satellite":
        mapView.mapType = .satellite
      case "hybrid":
        mapView.mapType = .hybrid
      default:
        mapView.mapType = .standard
      }
    }
  }

  @objc var onSelect: RCTBubblingEventBlock?

  override init(frame: CGRect) {
    super.init(frame: frame)

    mapView.translatesAutoresizingMaskIntoConstraints = false
    mapView.delegate = self
    mapView.showsCompass = true
    mapView.showsScale = true

    addSubview(mapView)

    NSLayoutConstraint.activate([
      mapView.topAnchor.constraint(equalTo: topAnchor),
      mapView.leadingAnchor.constraint(equalTo: leadingAnchor),
      mapView.trailingAnchor.constraint(equalTo: trailingAnchor),
      mapView.bottomAnchor.constraint(equalTo: bottomAnchor),
    ])
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  private func updateAnnotations() {
    mapView.removeAnnotations(mapView.annotations)

    let annotations: [HistoryStadiumAnnotation] = stadiums.compactMap {
      guard
        let stadium = $0 as? [String: Any],
        let name = stadium["name"] as? String,
        let latitude = stadium["latitude"] as? NSNumber,
        let longitude = stadium["longitude"] as? NSNumber
      else {
        return nil
      }

      let club = stadium["club"] as? String ?? ""
      let visits = (stadium["visits"] as? NSNumber)?.intValue ?? 0

      return HistoryStadiumAnnotation(
        coordinate: CLLocationCoordinate2D(
          latitude: latitude.doubleValue,
          longitude: longitude.doubleValue
        ),
        stadiumName: name,
        clubName: club,
        visits: visits
      )
    }

    guard !annotations.isEmpty else {
      return
    }

    mapView.addAnnotations(annotations)

    mapView.showAnnotations(
      annotations,
      animated: false
    )
  }

  func mapView(
    _ mapView: MKMapView,
    viewFor annotation: MKAnnotation
  ) -> MKAnnotationView? {
    guard let stadium = annotation as? HistoryStadiumAnnotation else {
      return nil
    }

    let identifier = "HistoryStadium"

    let view =
      mapView.dequeueReusableAnnotationView(
        withIdentifier: identifier
      ) as? MKMarkerAnnotationView
      ?? MKMarkerAnnotationView(
        annotation: stadium,
        reuseIdentifier: identifier
      )

    view.annotation = stadium
    view.canShowCallout = true
    view.markerTintColor = .systemRed
    view.glyphImage = UIImage(systemName: "sportscourt.fill")
    view.rightCalloutAccessoryView = UIButton(
      type: .detailDisclosure
    )

    return view
  }

  func mapView(
    _ mapView: MKMapView,
    annotationView view: MKAnnotationView,
    calloutAccessoryControlTapped control: UIControl
  ) {
    guard
      let stadium = view.annotation as? HistoryStadiumAnnotation
    else {
      return
    }

    onSelect?([
      "name": stadium.stadiumName,
    ])
  }
}

@objc(HistoryStadiumMapViewManager)
final class HistoryStadiumMapViewManager: RCTViewManager {
  override func view() -> UIView! {
    HistoryStadiumMapView()
  }

  override static func requiresMainQueueSetup() -> Bool {
    true
  }
}
