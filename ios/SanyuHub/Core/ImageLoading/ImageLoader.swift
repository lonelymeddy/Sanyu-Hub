import SwiftUI
import Combine

@MainActor
public class ImageLoader: ObservableObject {
    @Published public var image: UIImage?
    @Published public var isLoading = false

    private var url: URL?
    private var task: Task<Void, Never>?

    public func load(from urlString: String?) {
        guard let urlString = urlString, !urlString.isEmpty else { return }

        var finalUrlString = urlString
        if urlString.hasPrefix("/") {
            finalUrlString = "https://sanyuhub.com" + urlString
        }

        guard let url = URL(string: finalUrlString) else { return }
        self.url = url

        isLoading = true
        task?.cancel()

        task = Task {
            do {
                let (data, _) = try await URLSession.shared.data(from: url)
                if !Task.isCancelled, let loadedImage = UIImage(data: data) {
                    self.image = loadedImage
                }
            } catch {
                // Keep image as nil on error
            }
            if !Task.isCancelled {
                self.isLoading = false
            }
        }
    }

    public func cancel() {
        task?.cancel()
        isLoading = false
    }
}
