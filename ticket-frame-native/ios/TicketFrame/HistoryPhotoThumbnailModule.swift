import Foundation
import PDFKit
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


@objc(PdfTicketRendererModule)
final class PdfTicketRendererModule: NSObject {
  @objc(renderFirstPage:maxDimension:resolver:rejecter:)
  func renderFirstPage(
    _ sourceUri: NSString,
    maxDimension: NSNumber,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.global(qos: .userInitiated).async {
      let source = sourceUri as String

      let sourceURL: URL
      if source.hasPrefix("file://"),
         let parsedURL = URL(string: source) {
        sourceURL = parsedURL
      } else {
        sourceURL = URL(fileURLWithPath: source)
      }

      guard
        let document = PDFDocument(url: sourceURL),
        let page = document.page(at: 0)
      else {
        reject(
          "pdf_open_failed",
          "Ticket Frame could not open the PDF.",
          nil
        )
        return
      }

      let bounds = page.bounds(for: .mediaBox)

      guard bounds.width > 0, bounds.height > 0 else {
        reject(
          "pdf_invalid_page",
          "The first PDF page has an invalid size.",
          nil
        )
        return
      }

      let requestedMax = max(
        512.0,
        maxDimension.doubleValue
      )

      let scale = min(
        requestedMax / max(bounds.width, bounds.height),
        4.0
      )

      let outputSize = CGSize(
        width: max(1, floor(bounds.width * scale)),
        height: max(1, floor(bounds.height * scale))
      )

      let format = UIGraphicsImageRendererFormat()
      format.scale = 1
      format.opaque = true

      let renderer = UIGraphicsImageRenderer(
        size: outputSize,
        format: format
      )

      let image = renderer.image { context in
        UIColor.white.setFill()

        context.fill(
          CGRect(
            origin: .zero,
            size: outputSize
          )
        )

        let cg = context.cgContext

        cg.saveGState()

        cg.translateBy(
          x: 0,
          y: outputSize.height
        )

        cg.scaleBy(
          x: scale,
          y: -scale
        )

        cg.translateBy(
          x: -bounds.minX,
          y: -bounds.minY
        )

        page.draw(
          with: .mediaBox,
          to: cg
        )

        cg.restoreGState()
      }

      guard
        let data = image.jpegData(
          compressionQuality: 0.94
        )
      else {
        reject(
          "pdf_render_failed",
          "Ticket Frame could not render the PDF.",
          nil
        )
        return
      }

      do {
        let cacheDirectory =
          FileManager.default.urls(
            for: .cachesDirectory,
            in: .userDomainMask
          )[0]
          .appendingPathComponent(
            "ticket-pdf-renders",
            isDirectory: true
          )

        try FileManager.default.createDirectory(
          at: cacheDirectory,
          withIntermediateDirectories: true
        )

        let destination =
          cacheDirectory.appendingPathComponent(
            "ticket-\(UUID().uuidString).jpg"
          )

        try data.write(
          to: destination,
          options: .atomic
        )

        resolve([
          "uri": destination.absoluteString,
          "width": Int(outputSize.width),
          "height": Int(outputSize.height),
        ])
      } catch {
        reject(
          "pdf_write_failed",
          "Ticket Frame could not create the temporary PDF image.",
          error
        )
      }
    }
  }

  @objc static func requiresMainQueueSetup() -> Bool {
    false
  }
}
