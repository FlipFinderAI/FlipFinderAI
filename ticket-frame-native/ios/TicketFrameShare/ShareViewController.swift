import UIKit
import UniformTypeIdentifiers

final class ShareViewController: UIViewController {

    private let appGroup = "group.com.marcuslee.ticketframe"

    override func viewDidLoad() {
        super.viewDidLoad()

        handleIncomingPass()
    }

    private func handleIncomingPass() {

        guard let items = extensionContext?.inputItems as? [NSExtensionItem] else {
            finish()
            return
        }

        let providers = items
            .compactMap { $0.attachments }
            .flatMap { $0 }

        guard let provider = providers.first else {
            finish()
            return
        }

        let types = [
            UTType.data.identifier,
            UTType.fileURL.identifier
        ]

        for type in types {
            if provider.hasItemConformingToTypeIdentifier(type) {

                provider.loadItem(
                    forTypeIdentifier: type,
                    options: nil
                ) { [weak self] item, error in

                    guard let self else { return }

                    if let error {
                        print(error)
                        self.finish()
                        return
                    }

                    do {
                        try self.saveToSharedContainer(item)
                    } catch {
                        print(error)
                    }

                    self.finish()
                }

                return
            }
        }

        finish()
    }


    private func saveToSharedContainer(_ item: NSSecureCoding?) throws {

        guard let container =
                FileManager.default.containerURL(
                    forSecurityApplicationGroupIdentifier:
                        appGroup
                )
        else {
            throw NSError(
                domain: "TicketFrame",
                code: 1
            )
        }


        let folder = container
            .appendingPathComponent(
                "WalletInbox",
                isDirectory: true
            )


        try FileManager.default.createDirectory(
            at: folder,
            withIntermediateDirectories: true
        )


        let destination = folder
            .appendingPathComponent(
                "wallet-\(UUID().uuidString).pkpass"
            )


        if let url = item as? URL {

            try FileManager.default.copyItem(
                at: url,
                to: destination
            )

            print("Saved:", destination.path)

        } else if let data = item as? Data {

            try data.write(
                to: destination
            )

            print("Saved:", destination.path)

        } else {
            throw NSError(
                domain: "TicketFrame",
                code: 2
            )
        }
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
