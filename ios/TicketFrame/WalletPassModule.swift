import Vision
import UIKit
import Foundation
import Photos
import React

@objc(WalletPassModule)
final class WalletPassModule: NSObject {
  private let appGroupIdentifier = "group.com.marcuslee.ticketframe"
  private let inboxName = "WalletInbox"
  private let screenshotInboxName = "SharedScreenshotInbox"

  private func inboxURL() -> URL? {
    guard let container = FileManager.default.containerURL(
      forSecurityApplicationGroupIdentifier: appGroupIdentifier
    ) else {
      return nil
    }

    return container.appendingPathComponent(inboxName, isDirectory: true)
  }

  private func screenshotInboxURL() -> URL? {
    guard let container = FileManager.default.containerURL(
      forSecurityApplicationGroupIdentifier: appGroupIdentifier
    ) else {
      return nil
    }

    return container.appendingPathComponent(
      screenshotInboxName,
      isDirectory: true
    )
  }

  @objc(listPendingPasses:rejecter:)
  func listPendingPasses(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let inbox = inboxURL() else {
      reject(
        "wallet_inbox_unavailable",
        "Ticket Frame Wallet inbox is unavailable.",
        nil
      )
      return
    }

    do {
      try FileManager.default.createDirectory(
        at: inbox,
        withIntermediateDirectories: true
      )

      let urls = try FileManager.default.contentsOfDirectory(
        at: inbox,
        includingPropertiesForKeys: [.contentModificationDateKey, .fileSizeKey],
        options: [.skipsHiddenFiles]
      )

      let passes: [[String: Any]] = urls
        .filter { $0.pathExtension.lowercased() == "pkpass" }
        .compactMap { url in
          let values = try? url.resourceValues(
            forKeys: [.contentModificationDateKey, .fileSizeKey]
          )

          var result: [String: Any] = [
            "name": url.lastPathComponent,
            "uri": url.absoluteString
          ]

          if let size = values?.fileSize {
            result["size"] = size
          }

          if let modified = values?.contentModificationDate {
            result["modifiedAt"] = modified.timeIntervalSince1970 * 1000
          }

          return result
        }
        .sorted {
          (($0["modifiedAt"] as? Double) ?? 0) >
          (($1["modifiedAt"] as? Double) ?? 0)
        }

      resolve(passes)
    } catch {
      reject(
        "wallet_inbox_read_failed",
        "Could not read forwarded Wallet passes.",
        error
      )
    }
  }

  @objc(readPendingPass:resolver:rejecter:)
  func readPendingPass(
    _ fileName: NSString,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let inbox = inboxURL() else {
      reject(
        "wallet_inbox_unavailable",
        "Ticket Frame Wallet inbox is unavailable.",
        nil
      )
      return
    }

    let requestedName = fileName as String

    guard
      !requestedName.isEmpty,
      URL(fileURLWithPath: requestedName).lastPathComponent == requestedName,
      requestedName.lowercased().hasSuffix(".pkpass")
    else {
      reject(
        "wallet_pass_invalid_name",
        "Invalid Wallet pass filename.",
        nil
      )
      return
    }

    let target = inbox.appendingPathComponent(requestedName)

    do {
      let data = try Data(contentsOf: target, options: [.mappedIfSafe])

      resolve([
        "name": requestedName,
        "base64": data.base64EncodedString()
      ])
    } catch {
      reject(
        "wallet_pass_read_failed",
        "Could not read forwarded Wallet pass.",
        error
      )
    }
  }

  @objc(removePendingPass:resolver:rejecter:)
  func removePendingPass(
    _ fileName: NSString,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let inbox = inboxURL() else {
      reject(
        "wallet_inbox_unavailable",
        "Ticket Frame Wallet inbox is unavailable.",
        nil
      )
      return
    }

    let requestedName = fileName as String

    guard
      !requestedName.isEmpty,
      URL(fileURLWithPath: requestedName).lastPathComponent == requestedName,
      requestedName.lowercased().hasSuffix(".pkpass")
    else {
      reject(
        "wallet_pass_invalid_name",
        "Invalid Wallet pass filename.",
        nil
      )
      return
    }

    let target = inbox.appendingPathComponent(requestedName)

    do {
      if FileManager.default.fileExists(atPath: target.path) {
        try FileManager.default.removeItem(at: target)
      }

      resolve(true)
    } catch {
      reject(
        "wallet_pass_remove_failed",
        "Could not remove processed Wallet pass.",
        error
      )
    }
  }


  @objc(listPendingScreenshots:rejecter:)
  func listPendingScreenshots(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let inbox = screenshotInboxURL() else {
      reject(
        "screenshot_inbox_unavailable",
        "Ticket Frame screenshot inbox is unavailable.",
        nil
      )
      return
    }

    do {
      try FileManager.default.createDirectory(
        at: inbox,
        withIntermediateDirectories: true
      )

      let urls = try FileManager.default.contentsOfDirectory(
        at: inbox,
        includingPropertiesForKeys: [.contentModificationDateKey, .fileSizeKey],
        options: [.skipsHiddenFiles]
      )

      let screenshots: [[String: Any]] = urls
        .filter {
          ["png", "jpg", "jpeg"].contains($0.pathExtension.lowercased())
        }
        .compactMap { url in
          let values = try? url.resourceValues(
            forKeys: [.contentModificationDateKey, .fileSizeKey]
          )

          var result: [String: Any] = [
            "name": url.lastPathComponent,
            "uri": url.absoluteString
          ]

          if let size = values?.fileSize {
            result["size"] = size
          }

          if let modified = values?.contentModificationDate {
            result["modifiedAt"] =
              modified.timeIntervalSince1970 * 1000
          }

          return result
        }
        .sorted {
          (($0["modifiedAt"] as? Double) ?? 0) >
          (($1["modifiedAt"] as? Double) ?? 0)
        }

      resolve(screenshots)
    } catch {
      reject(
        "screenshot_inbox_read_failed",
        "Could not read shared screenshots.",
        error
      )
    }
  }

  @objc(readPendingScreenshot:resolver:rejecter:)
  func readPendingScreenshot(
    _ fileName: NSString,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let inbox = screenshotInboxURL() else {
      reject(
        "screenshot_inbox_unavailable",
        "Ticket Frame screenshot inbox is unavailable.",
        nil
      )
      return
    }

    let requestedName = fileName as String
    let ext = URL(fileURLWithPath: requestedName)
      .pathExtension
      .lowercased()

    guard
      !requestedName.isEmpty,
      URL(fileURLWithPath: requestedName).lastPathComponent == requestedName,
      ["png", "jpg", "jpeg"].contains(ext)
    else {
      reject(
        "screenshot_invalid_name",
        "Invalid screenshot filename.",
        nil
      )
      return
    }

    let target = inbox.appendingPathComponent(requestedName)

    do {
      let data = try Data(contentsOf: target, options: [.mappedIfSafe])

      resolve([
        "name": requestedName,
        "uri": target.absoluteString,
        "base64": data.base64EncodedString()
      ])
    } catch {
      reject(
        "screenshot_read_failed",
        "Could not read shared screenshot.",
        error
      )
    }
  }

  @objc(removePendingScreenshot:resolver:rejecter:)
  func removePendingScreenshot(
    _ fileName: NSString,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let inbox = screenshotInboxURL() else {
      reject(
        "screenshot_inbox_unavailable",
        "Ticket Frame screenshot inbox is unavailable.",
        nil
      )
      return
    }

    let requestedName = fileName as String
    let ext = URL(fileURLWithPath: requestedName)
      .pathExtension
      .lowercased()

    guard
      !requestedName.isEmpty,
      URL(fileURLWithPath: requestedName).lastPathComponent == requestedName,
      ["png", "jpg", "jpeg"].contains(ext)
    else {
      reject(
        "screenshot_invalid_name",
        "Invalid screenshot filename.",
        nil
      )
      return
    }

    let target = inbox.appendingPathComponent(requestedName)

    do {
      if FileManager.default.fileExists(atPath: target.path) {
        try FileManager.default.removeItem(at: target)
      }

      resolve(true)
    } catch {
      reject(
        "screenshot_remove_failed",
        "Could not remove processed screenshot.",
        error
      )
    }
  }


  @objc(queueScreenshotsSince:resolver:rejecter:)
  func queueScreenshotsSince(
    _ sinceMs: NSNumber,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let inbox = screenshotInboxURL() else {
      reject(
        "screenshot_inbox_unavailable",
        "Ticket Frame screenshot inbox is unavailable.",
        nil
      )
      return
    }

    let since = Date(
      timeIntervalSince1970: sinceMs.doubleValue / 1000.0
    )

    do {
      try FileManager.default.createDirectory(
        at: inbox,
        withIntermediateDirectories: true
      )
    } catch {
      reject(
        "screenshot_inbox_create_failed",
        "Could not create Ticket Frame screenshot inbox.",
        error
      )
      return
    }

    let options = PHFetchOptions()

    options.predicate = NSPredicate(
      format: "creationDate >= %@ AND (mediaSubtype & %d) != 0",
      since as NSDate,
      PHAssetMediaSubtype.photoScreenshot.rawValue
    )

    options.sortDescriptors = [
      NSSortDescriptor(
        key: "creationDate",
        ascending: true
      )
    ]

    let assets = PHAsset.fetchAssets(
      with: .image,
      options: options
    )

    if assets.count == 0 {
      resolve([
        "queued": 0,
        "skipped": 0
      ])
      return
    }

    let group = DispatchGroup()
    let lock = NSLock()

    var queued = 0
    var skipped = 0
    var firstError: Error?

    let imageOptions = PHImageRequestOptions()
    imageOptions.isNetworkAccessAllowed = true
    imageOptions.deliveryMode = .highQualityFormat
    imageOptions.version = .current

    assets.enumerateObjects { asset, _, _ in
      let safeIdentifier = asset.localIdentifier.unicodeScalars
        .map {
          CharacterSet.alphanumerics.contains($0)
            ? String($0)
            : "_"
        }
        .joined()

      let destination = inbox.appendingPathComponent(
        "single-photo-\(safeIdentifier).png"
      )

      // Stable filename = the same Photos screenshot cannot be
      // placed into the Ticket Frame inbox more than once.
      if FileManager.default.fileExists(
        atPath: destination.path
      ) {
        lock.lock()
        skipped += 1
        lock.unlock()
        return
      }

      group.enter()

      PHImageManager.default()
        .requestImageDataAndOrientation(
          for: asset,
          options: imageOptions
        ) { data, _, _, _ in
          defer { group.leave() }

          guard
            let data,
            let image = UIImage(data: data),
            let pngData = image.pngData()
          else {
            lock.lock()
            skipped += 1
            lock.unlock()
            return
          }

          do {
            try pngData.write(
              to: destination,
              options: .atomic
            )

            lock.lock()
            queued += 1
            lock.unlock()
          } catch {
            lock.lock()

            if firstError == nil {
              firstError = error
            }

            lock.unlock()
          }
        }
    }

    group.notify(
      queue: DispatchQueue.global(qos: .userInitiated)
    ) {
      if let firstError {
        reject(
          "wallet_screenshot_queue_failed",
          "Could not queue Wallet screenshots.",
          firstError
        )
        return
      }

      resolve([
        "queued": queued,
        "skipped": skipped
      ])
    }
  }

  @objc static func requiresMainQueueSetup() -> Bool {
    false
  }

    @objc(detectWalletTicketBounds:resolver:rejecter:)
    func detectWalletTicketBounds(
        _ uri: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        DispatchQueue.global(qos: .userInitiated).async {
            let url: URL

            if let parsed = URL(string: uri), parsed.isFileURL {
                url = parsed
            } else {
                url = URL(fileURLWithPath: uri)
            }

            guard
                let image = UIImage(contentsOfFile: url.path),
                let cgImage = image.cgImage
            else {
                resolve(nil)
                return
            }

            let width = CGFloat(cgImage.width)
            let height = CGFloat(cgImage.height)

            let request = VNDetectRectanglesRequest()
            request.maximumObservations = 12
            request.minimumConfidence = 0.50
            request.minimumAspectRatio = 0.30
            request.maximumAspectRatio = 1.00
            request.minimumSize = 0.20
            request.quadratureTolerance = 25.0

            let handler = VNImageRequestHandler(
                cgImage: cgImage,
                orientation: .up,
                options: [:]
            )

            do {
                try handler.perform([request])

                guard let observations = request.results else {
                    resolve(nil)
                    return
                }

                let candidates = observations.filter { observation in
                    let box = observation.boundingBox

                    let largeEnough =
                        box.width >= 0.55 &&
                        box.height >= 0.30

                    // Prevent Vision simply returning the entire screenshot.
                    let notWholeScreen =
                        box.width < 0.985 ||
                        box.height < 0.985

                    return largeEnough && notWholeScreen
                }

                guard let best = candidates.max(by: {
                    ($0.boundingBox.width * $0.boundingBox.height) <
                    ($1.boundingBox.width * $1.boundingBox.height)
                }) else {
                    resolve(nil)
                    return
                }

                let box = best.boundingBox

                var x = box.minX * width
                var y = (1.0 - box.maxY) * height
                var w = box.width * width
                var h = box.height * height

                // Tiny safety margin so the ticket edge is never clipped.
                let margin: CGFloat = 2.0

                x = max(0, x - margin)
                y = max(0, y - margin)

                w = min(width - x, w + (margin * 2))
                h = min(height - y, h + (margin * 2))

                resolve([
                    "x": Int(x.rounded()),
                    "y": Int(y.rounded()),
                    "width": Int(w.rounded()),
                    "height": Int(h.rounded()),
                    "imageWidth": Int(width),
                    "imageHeight": Int(height)
                ])
            } catch {
                print(
                    "[wallet-crop] Vision rectangle detection failed:",
                    error
                )
                resolve(nil)
            }
        }
    }


}
