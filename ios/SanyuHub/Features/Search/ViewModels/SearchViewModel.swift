import SwiftUI
import Combine

@MainActor
public class SearchViewModel: ObservableObject {
    @Published public var query: String = ""
    @Published public var isSearching = false

    @Published public var movieResults: [Movie] = []
    @Published public var seriesResults: [Series] = []
    @Published public var concertResults: [Concert] = []
    @Published public var channelResults: [LiveChannel] = []

    private let contentRepo: ContentRepositoryProtocol
    private let liveTVRepo: LiveTVRepositoryProtocol
    private var cancellables = Set<AnyCancellable>()

    public init(
        contentRepo: ContentRepositoryProtocol = ContentRepository(),
        liveTVRepo: LiveTVRepositoryProtocol = LiveTVRepository()
    ) {
        self.contentRepo = contentRepo
        self.liveTVRepo = liveTVRepo

        $query
            .debounce(for: .milliseconds(300), scheduler: DispatchQueue.main)
            .sink { [weak self] q in
                Task { [weak self] in
                    await self?.performSearch(query: q)
                }
            }
            .store(in: &cancellables)
    }

    public func performSearch(query: String) async {
        let cleanQuery = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleanQuery.isEmpty else {
            movieResults = []
            seriesResults = []
            concertResults = []
            channelResults = []
            isSearching = false
            return
        }

        isSearching = true

        // Search Channels
        self.channelResults = liveTVRepo.getAllChannels().filter { ch in
            ch.name.lowercased().contains(cleanQuery.lowercased()) ||
            (ch.category.lowercased().contains(cleanQuery.lowercased()))
        }

        do {
            async let moviesFetch = contentRepo.getMovies(page: 1, limit: 20, search: cleanQuery, vj: nil, genre: nil, year: nil, sort: nil)
            async let seriesFetch = contentRepo.getSeries(page: 1, limit: 20, search: cleanQuery, vj: nil, genre: nil, year: nil, sort: nil)
            async let concertsFetch = contentRepo.getConcerts(page: 1, limit: 20, search: cleanQuery)

            let (moviesRes, seriesRes, concertsRes) = try await (moviesFetch, seriesFetch, concertsFetch)

            self.movieResults = moviesRes.movies
            self.seriesResults = seriesRes.series
            self.concertResults = concertsRes.concerts
        } catch {
            // Error handling - keep existing local channel results
        }

        isSearching = false
    }
}
