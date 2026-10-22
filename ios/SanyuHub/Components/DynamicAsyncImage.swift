import SwiftUI

public struct DynamicAsyncImage: View {
    public let urlString: String?
    public let contentMode: ContentMode

    public init(urlString: String?, contentMode: ContentMode = .fill) {
        self.urlString = urlString
        self.contentMode = contentMode
    }

    private var formattedURL: URL? {
        guard let urlString = urlString, !urlString.isEmpty else { return nil }
        if urlString.hasPrefix("/") {
            return URL(string: "https://sanyuhub.com" + urlString)
        }
        return URL(string: urlString)
    }

    public var body: some View {
        if let url = formattedURL {
            AsyncImage(url: url) { phase in
                switch phase {
                case .empty:
                    ZStack {
                        Theme.surface
                        ProgressView()
                            .tint(Theme.accent)
                    }
                case .success(let image):
                    image
                        .resizable()
                        .aspectRatio(contentMode: contentMode)
                case .failure:
                    placeholderView
                @unknown default:
                    placeholderView
                }
            }
        } else {
            placeholderView
        }
    }

    private var placeholderView: some View {
        ZStack {
            Theme.surface
            Image(systemName: "film")
                .font(.system(size: 28))
                .foregroundColor(Theme.textMuted)
        }
    }
}
