import Foundation

public struct PaginatedMovieResponse: Codable {
    public let movies: [Movie]
    public let page: Int
    public let limit: Int
    public let total: Int
    public let totalPages: Int
    public let vjs: [String]?
    public let genres: [String]?
}

public struct PaginatedSeriesResponse: Codable {
    public let series: [Series]
    public let page: Int
    public let limit: Int
    public let total: Int
    public let totalPages: Int
    public let genres: [String]?
}

public struct PaginatedConcertResponse: Codable {
    public let concerts: [Concert]
    public let page: Int
    public let limit: Int
    public let total: Int
    public let totalPages: Int
}

public struct ViewerCountResponse: Codable {
    public let channelId: String
    public let viewers: Int?
    public let message: String?
}

public struct EpgResponse: Codable {
    public let channelId: String
    public let schedule: [EpgScheduleItem]?
    public let message: String?
}

public struct EpgScheduleItem: Codable, Identifiable, Hashable {
    public var id: String { title + (startTime ?? "") }
    public let title: String
    public let startTime: String?
    public let endTime: String?
    public let description: String?
}
