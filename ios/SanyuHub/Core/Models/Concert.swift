import Foundation

public struct Concert: Identifiable, Codable, Hashable {
    public let id: String
    public let title: String
    public let venue: String?
    public let description: String?
    public let thumbUrl: String?
    public let slug: String?
    public let organizer: String?
    public let date: String?
    public let time: String?

    public init(
        id: String,
        title: String,
        venue: String? = nil,
        description: String? = nil,
        thumbUrl: String? = nil,
        slug: String? = nil,
        organizer: String? = nil,
        date: String? = nil,
        time: String? = nil
    ) {
        self.id = id
        self.title = title
        self.venue = venue
        self.description = description
        self.thumbUrl = thumbUrl
        self.slug = slug
        self.organizer = organizer
        self.date = date
        self.time = time
    }

    enum CodingKeys: String, CodingKey {
        case id, title, venue, description, slug, organizer, date, time
        case thumbUrl = "thumb_url"
    }
}
