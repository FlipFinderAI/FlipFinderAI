import UIKit
import UniformTypeIdentifiers
import Vision
import CryptoKit

final class ShareViewController: UIViewController {

    private let appGroup = "group.com.marcuslee.ticketframe"

    override func viewDidLoad() {
        super.viewDidLoad()

        handleIncomingPass()
    }

    private func handleIncomingPass() {

        guard let items = extensionContext?.inputItems as? [NSExtensionItem] else {
            print("[wallet-share] no extension items")
            finish()
            return
        }

        let providers = items
            .compactMap { $0.attachments }
            .flatMap { $0 }

        print("[wallet-share] provider count:", providers.count)

        guard let provider = providers.first else {
            print("[wallet-share] no provider")
            finish()
            return
        }

        print(
            "[wallet-share] registered types:",
            provider.registeredTypeIdentifiers
        )

        let types = [
            UTType.png.identifier,
            UTType.jpeg.identifier,
            UTType.image.identifier
        ]

        for type in types {
            let supported =
                provider.hasItemConformingToTypeIdentifier(type)

            print(
                "[wallet-share] checking:",
                type,
                supported
            )

            if supported {
                if UTType(type)?.conforms(to: .image) == true {
                    saveScreenshotFile(
                        provider: provider,
                        typeIdentifier: type,
                        batch: true
                    )
                    return
                }

    provider.loadItem(
                    forTypeIdentifier: type,
                    options: nil
                ) { [weak self] item, error in

                    guard let self else { return }

                    if let error {
                        print("[wallet-share] load error:", error)
                        self.finish()
                        return
                    }

                    do {
                        try self.saveToSharedContainer(
                            item,
                            typeIdentifier: type
                        )
                        print("[wallet-share] saved successfully")
                    } catch {
                        print("[wallet-share] save error:", error)
                    }

                    self.finish()
                }

                return
            }
        }

        print("[wallet-share] no supported type")
        finish()
    }



    private func importSingleScreenshotAndOpenTicketFrame(
        provider: NSItemProvider,
        typeIdentifier: String
    ) {
        provider.loadFileRepresentation(
            forTypeIdentifier: typeIdentifier
        ) { [weak self] sourceURL, error in

            guard let self else { return }

            if let error {
                print(
                    "[wallet-share] single screenshot load error:",
                    error
                )
                self.finish()
                return
            }

            guard
                let sourceURL,
                let container = FileManager.default.containerURL(
                    forSecurityApplicationGroupIdentifier: self.appGroup
                )
            else {
                print(
                    "[wallet-share] single screenshot missing"
                )
                self.finish()
                return
            }

            let folder = container.appendingPathComponent(
                "SharedScreenshotInbox",
                isDirectory: true
            )

            do {
                try FileManager.default.createDirectory(
                    at: folder,
                    withIntermediateDirectories: true
                )

                let destination =
                    folder.appendingPathComponent(
                        "single-\(UUID().uuidString).png"
                    )

                if FileManager.default.fileExists(
                    atPath: destination.path
                ) {
                    try FileManager.default.removeItem(
                        at: destination
                    )
                }

                /*
                 Keep the exact screenshot file representation.
                 Ticket Frame performs its normal crop/import
                 after the handoff.
                */
                try FileManager.default.copyItem(
                    at: sourceURL,
                    to: destination
                )

                print(
                    "[wallet-share] single screenshot saved:",
                    destination.lastPathComponent
                )

                DispatchQueue.main.async {
                    self.openTicketFrameAfterSingleImport()
                }

            } catch {
                print(
                    "[wallet-share] single screenshot save error:",
                    error
                )
                self.finish()
            }
        }
    }

    private func openTicketFrameAfterSingleImport() {
        guard let url = URL(
            string: "ticketframe://wallet-screenshot-import"
        ) else {
            finish()
            return
        }

        /*
         Deliberately try the direct handoff the user wants.

         If iOS permits it:
             Share -> Ticket Frame immediately.

         If iOS blocks containing-app foregrounding,
         the result of open() will tell us on the phone test.
        */
        extensionContext?.open(
            url,
            completionHandler: { [weak self] success in
                print(
                    "[wallet-share] Ticket Frame open result:",
                    success
                )

                DispatchQueue.main.asyncAfter(
                    deadline: .now() + 0.20
                ) {
                    self?.extensionContext?
                        .completeRequest(
                            returningItems: nil,
                            completionHandler: nil
                        )
                }
            }
        )
    }


    private func presentScreenshotImportChoice(
        provider: NSItemProvider,
        typeIdentifier: String
    ) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }

            let alert = UIAlertController(
                title: "Add Wallet Ticket",
                message:
                    "Choose Single Ticket if this is the only ticket you are adding.\n\n" +
                    "Choose Multiple Tickets if you have more Wallet tickets to add. " +
                    "After each screenshot is saved, you will return to Wallet for the next one. " +
                    "When you are finished, open Ticket Frame once to crop and review the whole batch.",
                preferredStyle: .alert
            )

            alert.addAction(
                UIAlertAction(
                    title: "Single Ticket",
                    style: .default
                ) { [weak self] _ in
                    self?.saveScreenshotFile(
                        provider: provider,
                        typeIdentifier: typeIdentifier,
                        batch: false
                    )
                }
            )

            alert.addAction(
                UIAlertAction(
                    title: "Multiple Tickets",
                    style: .default
                ) { [weak self] _ in
                    self?.saveScreenshotFile(
                        provider: provider,
                        typeIdentifier: typeIdentifier,
                        batch: true
                    )
                }
            )

            alert.addAction(
                UIAlertAction(
                    title: "Cancel",
                    style: .cancel
                ) { [weak self] _ in
                    self?.finish()
                }
            )

            self.present(alert, animated: true)
        }
    }

    private func saveScreenshotFile(
        provider: NSItemProvider,
        typeIdentifier: String,
        batch: Bool
    ) {
        provider.loadFileRepresentation(
            forTypeIdentifier: typeIdentifier
        ) { [weak self] url, error in

            guard let self else { return }

            if let error {
                print("[wallet-share] screenshot load error:", error)
                self.finish()
                return
            }

            guard
                let url,
                let image = UIImage(contentsOfFile: url.path)
            else {
                print("[wallet-share] screenshot image missing")
                self.finish()
                return
            }

            self.detectTicketCrop(in: image) { cropRect in
                let cropped =
                    cropRect.flatMap {
                        self.cropImage(image, rect: $0)
                    } ?? image

                DispatchQueue.main.async {
                    self.presentCropPreview(
                        image: cropped,
                        originalImage: image,
                        batch: batch
                    )
                }
            }
        }
    }

    private func detectTicketCrop(
        in image: UIImage,
        completion: @escaping (CGRect?) -> Void
    ) {
        guard let cgImage = image.cgImage else {
            completion(nil)
            return
        }

        DispatchQueue.global(qos: .userInitiated).async {
            let request = VNDetectRectanglesRequest()
            request.maximumObservations = 12
            request.minimumConfidence = 0.45
            request.minimumAspectRatio = 0.25
            request.maximumAspectRatio = 1.0
            request.minimumSize = 0.18
            request.quadratureTolerance = 30.0

            let handler = VNImageRequestHandler(
                cgImage: cgImage,
                orientation: .up,
                options: [:]
            )

            do {
                try handler.perform([request])

                let observations = request.results ?? []

                let candidates = observations.filter {
                    let b = $0.boundingBox

                    let usefulSize =
                        b.width >= 0.50 &&
                        b.height >= 0.25

                    let notWholeScreen =
                        b.width < 0.985 ||
                        b.height < 0.985

                    return usefulSize && notWholeScreen
                }

                guard let best = candidates.max(by: {
                    ($0.boundingBox.width * $0.boundingBox.height) <
                    ($1.boundingBox.width * $1.boundingBox.height)
                }) else {
                    completion(nil)
                    return
                }

                let width = CGFloat(cgImage.width)
                let height = CGFloat(cgImage.height)
                let b = best.boundingBox

                var rect = CGRect(
                    x: b.minX * width,
                    y: (1.0 - b.maxY) * height,
                    width: b.width * width,
                    height: b.height * height
                )

                // Tiny safety edge so the actual ticket border is retained.
                rect = rect.insetBy(dx: -2, dy: -2)
                rect = rect.intersection(
                    CGRect(
                        x: 0,
                        y: 0,
                        width: width,
                        height: height
                    )
                )

                completion(rect)
            } catch {
                print("[wallet-share] Vision crop error:", error)
                completion(nil)
            }
        }
    }

    private func cropImage(
        _ image: UIImage,
        rect: CGRect
    ) -> UIImage? {
        guard let cgImage = image.cgImage else {
            return nil
        }

        let imageBounds = CGRect(
            x: 0,
            y: 0,
            width: cgImage.width,
            height: cgImage.height
        )

        let safeRect = rect
            .integral
            .intersection(imageBounds)

        guard
            !safeRect.isEmpty,
            let croppedCG = cgImage.cropping(to: safeRect)
        else {
            return nil
        }

        return UIImage(
            cgImage: croppedCG,
            scale: image.scale,
            orientation: image.imageOrientation
        )
    }

    private func presentCropPreview(
        image: UIImage,
        originalImage: UIImage,
        batch: Bool
    ) {
        let preview = UIViewController()
        preview.view.backgroundColor = .systemBackground

        let titleLabel = UILabel()
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        titleLabel.text = "Check Ticket"
        titleLabel.font = .systemFont(
            ofSize: 17,
            weight: .semibold
        )
        titleLabel.textAlignment = .center

        let instruction = UILabel()
        instruction.translatesAutoresizingMaskIntoConstraints = false
        instruction.text =
            "Check the crop, then choose which image to use."
        instruction.numberOfLines = 0
        instruction.textAlignment = .center
        instruction.font = .systemFont(
            ofSize: 16,
            weight: .regular
        )

        let imageView = UIImageView(image: image)
        imageView.translatesAutoresizingMaskIntoConstraints = false
        imageView.contentMode = .scaleAspectFit
        imageView.backgroundColor = .secondarySystemBackground
        imageView.layer.borderWidth = 2
        imageView.layer.borderColor =
            UIColor.systemBlue.cgColor
        imageView.layer.cornerRadius = 10
        imageView.clipsToBounds = true

        let originalButton = UIButton(type: .system)
        originalButton.translatesAutoresizingMaskIntoConstraints = false
        originalButton.setTitle(
            "Use this ticket",
            for: .normal
        )

        let cancelButton = UIButton(type: .system)
        cancelButton.translatesAutoresizingMaskIntoConstraints = false
        cancelButton.setTitle("Cancel", for: .normal)

        preview.view.addSubview(titleLabel)
        preview.view.addSubview(instruction)
        preview.view.addSubview(imageView)
        preview.view.addSubview(originalButton)
        preview.view.addSubview(cancelButton)

        NSLayoutConstraint.activate([
            titleLabel.topAnchor.constraint(
                equalTo: preview.view.safeAreaLayoutGuide.topAnchor,
                constant: 20
            ),
            titleLabel.leadingAnchor.constraint(
                equalTo: preview.view.leadingAnchor,
                constant: 20
            ),
            titleLabel.trailingAnchor.constraint(
                equalTo: preview.view.trailingAnchor,
                constant: -20
            ),

            instruction.topAnchor.constraint(
                equalTo: titleLabel.bottomAnchor,
                constant: 12
            ),
            instruction.leadingAnchor.constraint(
                equalTo: preview.view.leadingAnchor,
                constant: 24
            ),
            instruction.trailingAnchor.constraint(
                equalTo: preview.view.trailingAnchor,
                constant: -24
            ),

            imageView.topAnchor.constraint(
                equalTo: instruction.bottomAnchor,
                constant: 18
            ),
            imageView.leadingAnchor.constraint(
                equalTo: preview.view.leadingAnchor,
                constant: 16
            ),
            imageView.trailingAnchor.constraint(
                equalTo: preview.view.trailingAnchor,
                constant: -16
            ),
            imageView.bottomAnchor.constraint(
                equalTo: originalButton.topAnchor,
                constant: -20
            ),

            originalButton.leadingAnchor.constraint(
                equalTo: preview.view.leadingAnchor,
                constant: 24
            ),
            originalButton.trailingAnchor.constraint(
                equalTo: preview.view.trailingAnchor,
                constant: -24
            ),
            originalButton.bottomAnchor.constraint(
                equalTo: cancelButton.topAnchor,
                constant: -8
            ),
            originalButton.heightAnchor.constraint(equalToConstant: 50),

            cancelButton.leadingAnchor.constraint(
                equalTo: preview.view.leadingAnchor,
                constant: 24
            ),
            cancelButton.trailingAnchor.constraint(
                equalTo: preview.view.trailingAnchor,
                constant: -24
            ),
            cancelButton.bottomAnchor.constraint(
                equalTo: preview.view.safeAreaLayoutGuide.bottomAnchor,
                constant: -14
            ),
            cancelButton.heightAnchor.constraint(equalToConstant: 44),
        ])

        originalButton.addAction(
            UIAction { [weak self, weak preview] _ in
                guard let self else { return }
                preview?.dismiss(animated: false) {
                    if batch {
                        self.savePreparedScreenshot(
                            originalImage,
                            batch: true
                        )
                    } else {
                        self.saveSingleTicketEvidence(
                            image: originalImage,
                            recognisedText: ""
                        )
                    }
                }
            },
            for: .touchUpInside
        )

        cancelButton.addAction(
            UIAction { [weak self] _ in
                self?.finish()
            },
            for: .touchUpInside
        )

        present(preview, animated: true)
    }

    private func recogniseSingleTicketInExtension(
        _ image: UIImage
    ) {
        guard let cgImage = image.cgImage else {
            savePreparedScreenshot(image, batch: false)
            return
        }

        let loading = UIAlertController(
            title: "Reading Ticket",
            message:
                "Ticket Frame is reading the cropped Wallet ticket. Keep this screen open.",
            preferredStyle: .alert
        )

        present(loading, animated: true)

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self else { return }

            let request = VNRecognizeTextRequest()
            request.recognitionLevel = .accurate
            request.usesLanguageCorrection = true
            request.recognitionLanguages = ["en-GB", "en-US"]

            let handler = VNImageRequestHandler(
                cgImage: cgImage,
                orientation: .up,
                options: [:]
            )

            do {
                try handler.perform([request])

                let text = (request.results ?? [])
                    .compactMap {
                        $0.topCandidates(1).first?.string
                    }
                    .joined(separator: "\n")

                DispatchQueue.main.async {
                    loading.dismiss(animated: false) {
                        self.presentSingleTicketReview(
                            image: image,
                            recognisedText: text
                        )
                    }
                }
            } catch {
                print("[wallet-share] OCR failed:", error)

                DispatchQueue.main.async {
                    loading.dismiss(animated: false) {
                        self.presentSingleTicketReview(
                            image: image,
                            recognisedText: ""
                        )
                    }
                }
            }
        }
    }

    private func presentSingleTicketReview(
        image: UIImage,
        recognisedText: String
    ) {
        let review = UIViewController()
        review.view.backgroundColor = .systemBackground

        let titleLabel = UILabel()
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        titleLabel.text = "Ticket Read"
        titleLabel.font = .preferredFont(forTextStyle: .title2)
        titleLabel.textAlignment = .center

        let instruction = UILabel()
        instruction.translatesAutoresizingMaskIntoConstraints = false
        instruction.text =
            "The ticket has been cropped and read without leaving this screen."
        instruction.numberOfLines = 0
        instruction.textAlignment = .center

        let imageView = UIImageView(image: image)
        imageView.translatesAutoresizingMaskIntoConstraints = false
        imageView.contentMode = .scaleAspectFit
        imageView.backgroundColor = .secondarySystemBackground
        imageView.layer.cornerRadius = 10
        imageView.clipsToBounds = true

        let textView = UITextView()
        textView.translatesAutoresizingMaskIntoConstraints = false
        textView.text =
            recognisedText.isEmpty
                ? "No readable text found. You can still save the ticket."
                : recognisedText
        textView.isEditable = false
        textView.font = .preferredFont(forTextStyle: .footnote)
        textView.backgroundColor = .secondarySystemBackground

        let saveButton = UIButton(type: .system)
        saveButton.translatesAutoresizingMaskIntoConstraints = false
        saveButton.setTitle("Save Ticket", for: .normal)

        review.view.addSubview(titleLabel)
        review.view.addSubview(instruction)
        review.view.addSubview(imageView)
        review.view.addSubview(textView)
        review.view.addSubview(saveButton)

        NSLayoutConstraint.activate([
            titleLabel.topAnchor.constraint(
                equalTo: review.view.safeAreaLayoutGuide.topAnchor,
                constant: 16
            ),
            titleLabel.leadingAnchor.constraint(
                equalTo: review.view.leadingAnchor,
                constant: 20
            ),
            titleLabel.trailingAnchor.constraint(
                equalTo: review.view.trailingAnchor,
                constant: -20
            ),

            instruction.topAnchor.constraint(
                equalTo: titleLabel.bottomAnchor,
                constant: 10
            ),
            instruction.leadingAnchor.constraint(
                equalTo: review.view.leadingAnchor,
                constant: 20
            ),
            instruction.trailingAnchor.constraint(
                equalTo: review.view.trailingAnchor,
                constant: -20
            ),

            imageView.topAnchor.constraint(
                equalTo: instruction.bottomAnchor,
                constant: 12
            ),
            imageView.leadingAnchor.constraint(
                equalTo: review.view.leadingAnchor,
                constant: 16
            ),
            imageView.trailingAnchor.constraint(
                equalTo: review.view.trailingAnchor,
                constant: -16
            ),
            imageView.heightAnchor.constraint(
                equalTo: review.view.heightAnchor,
                multiplier: 0.38
            ),

            textView.topAnchor.constraint(
                equalTo: imageView.bottomAnchor,
                constant: 10
            ),
            textView.leadingAnchor.constraint(
                equalTo: review.view.leadingAnchor,
                constant: 16
            ),
            textView.trailingAnchor.constraint(
                equalTo: review.view.trailingAnchor,
                constant: -16
            ),
            textView.bottomAnchor.constraint(
                equalTo: saveButton.topAnchor,
                constant: -12
            ),

            saveButton.leadingAnchor.constraint(
                equalTo: review.view.leadingAnchor,
                constant: 24
            ),
            saveButton.trailingAnchor.constraint(
                equalTo: review.view.trailingAnchor,
                constant: -24
            ),
            saveButton.bottomAnchor.constraint(
                equalTo: review.view.safeAreaLayoutGuide.bottomAnchor,
                constant: -14
            ),
            saveButton.heightAnchor.constraint(equalToConstant: 50),
        ])

        saveButton.addAction(
            UIAction { [weak self, weak review] _ in
                guard let self else { return }

                review?.dismiss(animated: false) {
                    self.saveSingleTicketEvidence(
                        image: image,
                        recognisedText: recognisedText
                    )
                }
            },
            for: .touchUpInside
        )

        present(review, animated: true)
    }

    private func saveSingleTicketEvidence(
        image: UIImage,
        recognisedText: String
    ) {
        guard
            let data = image.pngData(),
            let container = FileManager.default.containerURL(
                forSecurityApplicationGroupIdentifier: appGroup
            )
        else {
            finish()
            return
        }

        let folder = container.appendingPathComponent(
            "SharedScreenshotInbox",
            isDirectory: true
        )

        do {
            try FileManager.default.createDirectory(
                at: folder,
                withIntermediateDirectories: true
            )

            let token = UUID().uuidString

            let imageURL = folder.appendingPathComponent(
                "single-\(token).png"
            )

            try data.write(
                to: imageURL,
                options: .atomic
            )

            let evidenceURL = folder.appendingPathComponent(
                "single-\(token).ocr.txt"
            )

            if let evidence = recognisedText.data(using: .utf8) {
                try evidence.write(
                    to: evidenceURL,
                    options: .atomic
                )
            }

            let done = UIAlertController(
                title: "Ticket Saved",
                message:
                    "The ticket has been cropped, read and saved in Ticket Frame.",
                preferredStyle: .alert
            )

            done.addAction(
                UIAlertAction(
                    title: "Done",
                    style: .default
                ) { [weak self] _ in
                    self?.finish()
                }
            )

            present(done, animated: true)

        } catch {
            print("[wallet-share] save failed:", error)
            finish()
        }
    }

    private func savePreparedScreenshot(
        _ image: UIImage,
        batch: Bool
    ) {
        _ = batch

        guard
            let data = image.pngData(),
            let container = FileManager.default.containerURL(
                forSecurityApplicationGroupIdentifier: appGroup
            )
        else {
            print("[wallet-share] could not prepare screenshot")
            finish()
            return
        }

        let folder = container.appendingPathComponent(
            "SharedScreenshotInbox",
            isDirectory: true
        )

        do {
            try FileManager.default.createDirectory(
                at: folder,
                withIntermediateDirectories: true
            )

            let digest = SHA256.hash(data: data)
                .map { String(format: "%02x", $0) }
                .joined()

            // Stable queue identity. Sharing the same prepared screenshot
            // again produces the same filename instead of another UUID.
            let destination = folder.appendingPathComponent(
                "single-share-\(digest).png"
            )

            let alreadyQueued = FileManager.default.fileExists(
                atPath: destination.path
            )

            if !alreadyQueued {
                try data.write(
                    to: destination,
                    options: .atomic
                )
            }

            print(
                alreadyQueued
                    ? "[wallet-share] duplicate ignored:"
                    : "[wallet-share] screenshot queued:",
                destination.lastPathComponent
            )

            DispatchQueue.main.async { [weak self] in
                guard let self else { return }

                let alert = UIAlertController(
                    title: "Saved",
                    message: alreadyQueued
                        ? "This ticket is already saved."
                        : "This ticket is saved.",
                    preferredStyle: .alert
                )

                alert.addAction(
                    UIAlertAction(
                        title: "Add More",
                        style: .default
                    ) { [weak self] _ in
                        guard let self else { return }

                        self.dismiss(animated: false) {
                            self.extensionContext?.completeRequest(
                                returningItems: nil,
                                completionHandler: nil
                            )
                        }
                    }
                )

                alert.addAction(
                    UIAlertAction(
                        title: "Finished",
                        style: .default
                    ) { [weak self] _ in
                        let finished = UIAlertController(
                            title: "Finished",
                            message: "Return to Football Ticket Frame to add your saved tickets.",
                            preferredStyle: .alert
                        )

                        finished.addAction(
                            UIAlertAction(
                                title: "OK",
                                style: .default
                            ) { [weak self] _ in
                                guard let self else { return }

                                self.dismiss(animated: false) {
                                    self.finish()
                                }
                            }
                        )

                        self?.present(finished, animated: true)
                    }
                )

                self.present(alert, animated: true)
            }
        } catch {
            print("[wallet-share] screenshot save failed:", error)
            finish()
        }
    }

    private func saveToSharedContainer(
        _ item: Any?,
        typeIdentifier: String
    ) throws {

        guard let container =
                FileManager.default.containerURL(
                    forSecurityApplicationGroupIdentifier: appGroup
                )
        else {
            throw NSError(domain: "TicketFrame", code: 1)
        }

        let isImage =
            typeIdentifier == UTType.png.identifier ||
            typeIdentifier == UTType.jpeg.identifier ||
            typeIdentifier == UTType.image.identifier

        let folder = container
            .appendingPathComponent(
                isImage ? "SharedScreenshotInbox" : "WalletInbox",
                isDirectory: true
            )

        try FileManager.default.createDirectory(
            at: folder,
            withIntermediateDirectories: true
        )

        if let url = item as? URL {
            let sourceExtension = url.pathExtension.lowercased()

            let fileExtension: String
            if isImage {
                if sourceExtension == "png" || sourceExtension == "jpg" || sourceExtension == "jpeg" {
                    fileExtension = sourceExtension
                } else if typeIdentifier == UTType.jpeg.identifier {
                    fileExtension = "jpg"
                } else {
                    fileExtension = "png"
                }
            } else {
                fileExtension = "pkpass"
            }

            let destination = folder
                .appendingPathComponent(
                    "\(isImage ? "screenshot" : "wallet")-\(UUID().uuidString).\(fileExtension)"
                )

            // Byte-for-byte file copy. No UIImage decode, resize or re-encoding.
            try FileManager.default.copyItem(
                at: url,
                to: destination
            )

            print("[wallet-share] exact file copied:", destination.path)
            return
        }

        if let data = item as? Data {
            let fileExtension: String
            if isImage {
                fileExtension =
                    typeIdentifier == UTType.jpeg.identifier ? "jpg" : "png"
            } else {
                fileExtension = "pkpass"
            }

            let destination = folder
                .appendingPathComponent(
                    "\(isImage ? "screenshot" : "wallet")-\(UUID().uuidString).\(fileExtension)"
                )

            // Write the provider's original bytes directly.
            try data.write(
                to: destination,
                options: .atomic
            )

            print("[wallet-share] exact data saved:", destination.path)
            return
        }

        throw NSError(domain: "TicketFrame", code: 2)
    }


    private func finish() {

        DispatchQueue.main.async {
            self.extensionContext?
                .completeRequest(
                    returningItems: [],
                    completionHandler: nil
                )
        }
    }
}
