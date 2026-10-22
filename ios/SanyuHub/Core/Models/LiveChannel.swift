import Foundation

public struct LiveChannel: Identifiable, Codable, Hashable {
    public let id: String
    public let name: String
    public let category: String
    public let categoryLabel: String?
    public let logo: String
    public let streamType: String
    public let streamUrl: String
    public let embedUrl: String?
    public let meta: String?
    public let description: String?
    public let isRadio: Bool?
    public let type: String?
    public let aliases: [String]?

    public init(
        id: String,
        name: String,
        category: String,
        categoryLabel: String? = nil,
        logo: String,
        streamType: String = "hls",
        streamUrl: String,
        embedUrl: String? = nil,
        meta: String? = nil,
        description: String? = nil,
        isRadio: Bool? = false,
        type: String? = nil,
        aliases: [String]? = nil
    ) {
        self.id = id
        self.name = name
        self.category = category
        self.categoryLabel = categoryLabel
        self.logo = logo
        self.streamType = streamType
        self.streamUrl = streamUrl
        self.embedUrl = embedUrl
        self.meta = meta
        self.description = description
        self.isRadio = isRadio
        self.type = type
        self.aliases = aliases
    }
}
