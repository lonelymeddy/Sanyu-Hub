import Foundation

public protocol ContentRepositoryProtocol {
    func getMovies(page: Int, limit: Int, search: String?, vj: String?, genre: String?, year: Int?, sort: String?) async throws -> PaginatedMovieResponse
    func getMovieDetail(id: String) async throws -> Movie
    func getSeries(page: Int, limit: Int, search: String?, vj: String?, genre: String?, sort: String?) async throws -> PaginatedSeriesResponse
    func getSeriesDetail(id: String) async throws -> Series
    func getConcerts(page: Int, limit: Int, search: String?) async throws -> PaginatedConcertResponse
    func getConcertDetail(id: String) async throws -> Concert
}

public class ContentRepository: ContentRepositoryProtocol {
    private let networkService: NetworkServiceProtocol

    public init(networkService: NetworkServiceProtocol = NetworkService()) {
        self.networkService = networkService
    }

    public func getMovies(page: Int = 1, limit: Int = 24, search: String? = nil, vj: String? = nil, genre: String? = nil, year: Int? = nil, sort: String? = nil) async throws -> PaginatedMovieResponse {
        try await networkService.fetch(.getMovies(page: page, limit: limit, search: search, vj: vj, genre: genre, year: year, sort: sort))
    }

    public func getMovieDetail(id: String) async throws -> Movie {
        try await networkService.fetch(.getMovieDetail(id: id))
    }

    public func getSeries(page: Int = 1, limit: Int = 24, search: String? = nil, vj: String? = nil, genre: String? = nil, year: Int? = nil, sort: String? = nil) async throws -> PaginatedSeriesResponse {
        try await networkService.fetch(.getSeries(page: page, limit: limit, search: search, vj: vj, genre: genre, year: year, sort: sort))
    }

    public func getSeriesDetail(id: String) async throws -> Series {
        try await networkService.fetch(.getSeriesDetail(id: id))
    }

    public func getConcerts(page: Int = 1, limit: Int = 24, search: String? = nil) async throws -> PaginatedConcertResponse {
        try await networkService.fetch(.getConcerts(page: page, limit: limit, search: search))
    }

    public func getConcertDetail(id: String) async throws -> Concert {
        try await networkService.fetch(.getConcertDetail(id: id))
    }
}
