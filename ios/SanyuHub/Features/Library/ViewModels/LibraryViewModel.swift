import SwiftUI
import Combine

@MainActor
public class LibraryViewModel: ObservableObject {
    public enum Category: String, CaseIterable, Identifiable {
        case movies = "Movies"
        case series = "Series"
        case music = "Music"
        case concerts = "Concerts"

        public var id: String { self.rawValue }
    }

    @Published public var selectedCategory: Category = .movies
    @Published public var selectedVJ: String = "all"
    @Published public var searchQuery: String = ""

    @Published public var movies: [Movie] = []
    @Published public var seriesList: [Series] = []
    @Published public var concertsList: [Concert] = []
    @Published public var availableVJs: [String] = []

    @Published public var isLoading = false
    @Published public var errorMessage: String?

    private let contentRepo: ContentRepositoryProtocol

    public init(contentRepo: ContentRepositoryProtocol = ContentRepository()) {
        self.contentRepo = contentRepo
    }

    public func loadCurrentCategory() async {
        isLoading = true
        errorMessage = nil

        do {
            switch selectedCategory {
            case .movies, .music:
                let vjParam = (selectedCategory == .movies && selectedVJ != "all") ? selectedVJ : nil
                let genreParam = (selectedCategory == .music) ? "music" : nil
                let res = try await contentRepo.getMovies(
                    page: 1,
                    limit: 40,
                    search: searchQuery.isEmpty ? nil : searchQuery,
                    vj: vjParam,
                    genre: genreParam,
                    year: nil,
                    sort: "recently-added"
                )
                self.movies = res.movies
                if let vjs = res.vjs, !vjs.isEmpty {
                    self.availableVJs = ["all"] + vjs
                } else if self.availableVJs.isEmpty {
                    self.availableVJs = ["all", "junior", "ice p", "mark", "emmy", "jingo"]
                }

            case .series:
                let res = try await contentRepo.getSeries(
                    page: 1,
                    limit: 40,
                    search: searchQuery.isEmpty ? nil : searchQuery,
                    vj: nil,
                    genre: nil,
                    year: nil,
                    sort: "popular"
                )
                self.seriesList = res.series

            case .concerts:
                let res = try await contentRepo.getConcerts(
                    page: 1,
                    limit: 40,
                    search: searchQuery.isEmpty ? nil : searchQuery
                )
                self.concertsList = res.concerts
            }
        } catch {
            self.errorMessage = "Failed to load library items. Please check your connection."
        }

        isLoading = false
    }

    public func selectCategory(_ category: Category) {
        selectedCategory = category
        selectedVJ = "all"
        Task {
            await loadCurrentCategory()
        }
    }

    public func selectVJ(_ vj: String) {
        selectedVJ = vj
        Task {
            await loadCurrentCategory()
        }
    }
}
