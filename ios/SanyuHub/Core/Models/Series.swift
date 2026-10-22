import Foundation

public struct Episode: Identifiable, Codable, Hashable {
    public let id: String
    public let episodeNumber: Int
    public let title: String
    public let streamUrl: String?

    public init(id: String, episodeNumber: Int, title: String, streamUrl: String?) {
        self.id = id
        self.episodeNumber = episodeNumber
        self.title = title
        self.streamUrl = streamUrl
    }

    enum CodingKeys: String, CodingKey {
        case id, title
        case episodeNumber = "episode_number"
        case streamUrl = "stream_url"
    }
}

public struct Series: Identifiable, Codable, Hashable {
    public let id: String
    public let title: String
    public let vj: String?
    public let overview: String?
    public let poster: String?
    public let backdrop: String?
    public let rating: Double?
    public let genres: [String]?
    public let episodes: [Episode]?

    public init(
        id: String,
        title: String,
        vj: String? = nil,
        overview: String? = nil,
        poster: String? = nil,
        backdrop: String? = nil,
        rating: Double? = nil,
        genres: [String]? = nil,
        episodes: [Episode]? = nil
    ) {
        self.id = id
        self.title = title
        self.vj = vj
        self.overview = overview
        self.poster = poster
        self.backdrop = backdrop
        self.rating = rating
        self.genres = genres
        self.episodes = episodes
    }
}
