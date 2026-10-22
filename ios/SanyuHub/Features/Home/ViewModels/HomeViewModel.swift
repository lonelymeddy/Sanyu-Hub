import SwiftUI
import Combine

@MainActor
public class HomeViewModel: ObservableObject {
    @Published public var heroItems: [HeroItem] = []
    @Published public var liveTvSection: [LiveChannel] = []
    @Published public var trendingMoviesSection: [Movie] = []
    @Published public var hotMusicSection: [Movie] = []
    @Published public var concertsSection: [Concert] = []
    @Published public var radioSection: [LiveChannel] = []

    @Published public var isLoading = true
    @Published public var errorMessage: String?

    private let contentRepo: ContentRepositoryProtocol
    private let liveTVRepo: LiveTVRepositoryProtocol

    public init(
        contentRepo: ContentRepositoryProtocol = ContentRepository(),
        liveTVRepo: LiveTVRepositoryProtocol = LiveTVRepository()
    ) {
        self.contentRepo = contentRepo
        self.liveTVRepo = liveTVRepo
        setupHeroItems()
    }

    private func setupHeroItems() {
        self.heroItems = [
            HeroItem(
                id: "hero_ugandan_movies",
                title: "Ugandan Translated Movies",
                subtitle: "Watch top action & drama dubbed by VJ Junior, VJ Ice P & VJ Mark.",
                image: "https://sanyuhub.com/hero_top.png",
                isLocalImage: false,
                badgeText: "POPULAR VJS",
                actionType: .openCategory(category: "movies")
            ),
            HeroItem(
                id: "hero_vj_translators",
                title: "VJ Junior & VJ Ice P Hits",
                subtitle: "Stream non-stop Luganda translated blockbuster movies.",
                image: "https://sanyuhub.com/hero_scroll200.png",
                isLocalImage: false,
                badgeText: "HOT TRANSLATED",
                actionType: .openCategory(category: "movies")
            ),
            HeroItem(
                id: "hero_live_tv",
                title: "Live Ugandan TV & Radio",
                subtitle: "NTV, Spark TV, Bukedde, BBS Terefayina & 100.2 Galaxy FM.",
                image: "https://sanyuhub.com/images/ntv-logo.jpg",
                isLocalImage: false,
                badgeText: "24/7 LIVE",
                actionType: .openCategory(category: "live-tv")
            ),
            HeroItem(
                id: "hero_music",
                title: "Hot Ugandan Music",
                subtitle: "Discover new release Afrobeats, Dancehall, and Ugandan classics.",
                image: "https://sanyuhub.com/images/tracemziki-logo.png",
                isLocalImage: false,
                badgeText: "NEW MUSIC",
                actionType: .openCategory(category: "music")
            ),
            HeroItem(
                id: "hero_concerts",
                title: "Upcoming Concerts & Events",
                subtitle: "Live shows and music events happening across Uganda.",
                image: "https://sanyuhub.com/hero_top.png",
                isLocalImage: false,
                badgeText: "EVENTS",
                actionType: .openCategory(category: "concerts")
            )
        ]
    }

    public func loadData() async {
        isLoading = true
        errorMessage = nil

        // Section 1: Live TV (Up to 2 items)
        let allChannels = liveTVRepo.getAllChannels()
        self.liveTvSection = Array(allChannels.filter { !($0.isRadio == true) && $0.category != "radio" }.prefix(2))

        // Section 5: Radio (Up to 2 items)
        self.radioSection = Array(allChannels.filter { ($0.isRadio == true) || $0.category == "radio" }.prefix(2))

        do {
            // Section 2: Trending Movies (Up to 2 items)
            let movieRes = try await contentRepo.getMovies(page: 1, limit: 10, search: nil, vj: nil, genre: nil, year: nil, sort: nil)
            self.trendingMoviesSection = Array(movieRes.movies.prefix(2))

            // Section 3: Hot Music Movies (Up to 2 items)
            let musicMovies = movieRes.movies.filter { movie in
                movie.genres?.contains(where: { $0.lowercased().contains("music") }) ?? false
            }
            self.hotMusicSection = Array((musicMovies.isEmpty ? movieRes.movies.suffix(2) : musicMovies).prefix(2))

            // Section 4: Concerts (Up to 2 items)
            let concertRes = try await contentRepo.getConcerts(page: 1, limit: 10, search: nil)
            self.concertsSection = Array(concertRes.concerts.prefix(2))

        } catch {
            self.errorMessage = "Unable to load homepage content. Tap retry to attempt again."
        }

        isLoading = false
    }
}
