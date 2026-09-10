import Foundation
import React

@objc(WalletPassModule)
final class WalletPassModule: NSObject {
  private let appGroupIdentifier = "group.com.marcuslee.ticketframe"
  private let inboxName = "WalletInbox"

  private func inboxURL() -> URL? {
    guard let container = FileManager.default.containerURL(
      forSecurityApplicationGroupIdentifier: appGroupIdentifier
    ) else {
      return nil
    }

    return container.appendingPathComponent(inboxName, isDirectory: true)
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

  @objc static func requiresMainQueueSetup() -> Bool {
    false
  }
}
