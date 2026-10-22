import SwiftUI
import Combine

@MainActor
public class AppEnvironment: ObservableObject {
    @Published public var selectedTab: Tab = .home
    @Published public var isSearchPresented: Bool = false
    @Published public var activePlayerMedia: PlayerMedia?

    public let contentRepository: ContentRepositoryProtocol
    public let liveTVRepository: LiveTVRepositoryProtocol

    public enum Tab: Hashable {
        case home
        case library
        case liveTv
        case more
    }

    public enum PlayerMedia: Identifiable, Equatable {
        case movie(movie: Movie)
        case episode(series: Series, episode: Episode)
        case liveChannel(channel: LiveChannel)

        public var id: String {
            switch self {
            case .movie(let movie): return "movie_\(movie.id)"
            case .episode(let series, let episode): return "series_\(series.id)_\(episode.id)"
            case .liveChannel(let channel): return "livetv_\(channel.id)"
            }
        }

        public var title: String {
            switch self {
            case .movie(let movie): return movie.title
            case .episode(let series, let episode): return "\(series.title) — \(episode.title)"
            case .liveChannel(let channel): return channel.name
            }
        }

        public var streamUrl: String? {
            switch self {
            case .movie(let movie): return movie.streamUrl
            case .episode(_, let episode): return episode.streamUrl
            case .liveChannel(let channel): return channel.streamUrl
            }
        }
    }

    public init(
        contentRepository: ContentRepositoryProtocol = ContentRepository(),
        liveTVRepository: LiveTVRepositoryProtocol = LiveTVRepository()
    ) {
        self.contentRepository = contentRepository
        self.liveTVRepository = liveTVRepository
    }
}
