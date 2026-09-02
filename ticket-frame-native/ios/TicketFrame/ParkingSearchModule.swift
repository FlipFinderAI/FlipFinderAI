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
