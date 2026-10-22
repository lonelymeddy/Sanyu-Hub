import SwiftUI
import Combine

@MainActor
public class DetailViewModel: ObservableObject {
    @Published public var movie: Movie?
    @Published public var series: Series?
    @Published public var concert: Concert?
    @Published public var relatedMovies: [Movie] = []

    @Published public var isLoading = true
    @Published public var errorMessage: String?

    private let contentRepo: ContentRepositoryProtocol

    public init(contentRepo: ContentRepositoryProtocol = ContentRepository()) {
        self.contentRepo = contentRepo
    }

    public func loadMovieDetail(id: String) async {
        isLoading = true
        errorMessage = nil

        do {
            let item = try await contentRepo.getMovieDetail(id: id)
            self.movie = item

            let catalog = try await contentRepo.getMovies(page: 1, limit: 10, search: nil, vj: item.vj, genre: nil, year: nil, sort: nil)
            self.relatedMovies = catalog.movies.filter { $0.id != id }
        } catch {
            errorMessage = "Unable to load movie details."
        }

        isLoading = false
    }

    public func loadSeriesDetail(id: String) async {
        isLoading = true
        errorMessage = nil

        do {
            let item = try await contentRepo.getSeriesDetail(id: id)
            self.series = item
        } catch {
            errorMessage = "Unable to load series details."
        }

        isLoading = false
    }

    public func loadConcertDetail(id: String) async {
        isLoading = true
        errorMessage = nil

        do {
            let item = try await contentRepo.getConcertDetail(id: id)
            self.concert = item
        } catch {
            errorMessage = "Unable to load concert details."
        }

        isLoading = false
    }
}
