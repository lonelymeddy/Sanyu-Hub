import Foundation

public struct Movie: Identifiable, Codable, Hashable {
    public let id: String
    public let title: String
    public let vj: String?
    public let overview: String?
    public let poster: String?
    public let backdrop: String?
    public let streamUrl: String?
    public let rating: Double?
    public let year: Int?
    public let genres: [String]?

    public init(
        id: String,
        title: String,
        vj: String? = nil,
        overview: String? = nil,
        poster: String? = nil,
        backdrop: String? = nil,
        streamUrl: String? = nil,
        rating: Double? = nil,
        year: Int? = nil,
        genres: [String]? = nil
    ) {
        self.id = id
        self.title = title
        self.vj = vj
        self.overview = overview
        self.poster = poster
        self.backdrop = backdrop
        self.streamUrl = streamUrl
        self.rating = rating
        self.year = year
        self.genres = genres
    }

    enum CodingKeys: String, CodingKey {
        case id, title, vj, overview, poster, backdrop, rating, year, genres
        case streamUrl = "stream_url"
    }
}
