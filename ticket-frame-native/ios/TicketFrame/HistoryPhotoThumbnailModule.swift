import Foundation
import Photos
import React
import UIKit

@objc(HistoryPhotoThumbnailModule)
final class HistoryPhotoThumbnailModule: NSObject {
  @objc(thumbnail:width:height:resolver:rejecter:)
  func thumbnail(
    _ assetId: NSString,
    width: NSNumber,
    height: NSNumber,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let results = PHAsset.fetchAssets(
      withLocalIdentifiers: [assetId as String],
      options: nil
    )

    guard let asset = results.firstObject else {
      resolve(nil)
      return
    }

    let scale = UIScreen.main.scale
    let targetSize = CGSize(
      width: max(1, width.doubleValue) * scale,
      height: max(1, height.doubleValue) * scale
    )

    let options = PHImageRequestOptions()
    options.deliveryMode = .opportunistic
    options.resizeMode = .fast
    options.isNetworkAccessAllowed = false
    options.isSynchronous = false

    var resolved = false

    PHImageManager.default().requestImage(
      for: asset,
      targetSize: targetSize,
      contentMode: .aspectFill,
      options: options
    ) { image, info in
      if resolved {
        return
      }

      if let cancelled = info?[PHImageCancelledKey] as? Bool, cancelled {
        resolved = true
        resolve(nil)
        return
      }

      if info?[PHImageErrorKey] != nil {
        resolved = true
        resolve(nil)
        return
      }

      guard let image else {
        let inCloud = (info?[PHImageResultIsInCloudKey] as? Bool) ?? false
        if inCloud {
          resolved = true
          resolve(nil)
        }
        return
      }

      let degraded = (info?[PHImageResultIsDegradedKey] as? Bool) ?? false

      guard let data = image.jpegData(compressionQuality: degraded ? 0.72 : 0.86) else {
        if !degraded {
          resolved = true
          resolve(nil)
        }
        return
      }

      let cacheDirectory = FileManager.default.urls(
        for: .cachesDirectory,
        in: .userDomainMask
      )[0].appendingPathComponent(
        "history-photo-thumbnails",
        isDirectory: true
      )

      do {
        try FileManager.default.createDirectory(
          at: cacheDirectory,
          withIntermediateDirectories: true
        )

        let safeId = (assetId as String)
          .replacingOccurrences(
            of: "[^a-zA-Z0-9._-]",
            with: "_",
            options: .regularExpression
          )

        let destination = cacheDirectory
          .appendingPathComponent("history-\(safeId).jpg")

        try data.write(to: destination, options: .atomic)

        resolved = true
        resolve(destination.absoluteString)
      } catch {
        resolved = true
        resolve(nil)
      }
    }
  }

  @objc static func requiresMainQueueSetup() -> Bool {
    false
  }
}
