import Foundation

public struct HeroItem: Identifiable, Hashable {
    public let id: String
    public let title: String
    public let subtitle: String
    public let image: String
    public let isLocalImage: Bool
    public let badgeText: String
    public let actionType: ActionType
    public let targetId: String?

    public enum ActionType: Hashable {
        case watchMovie(id: String)
        case watchChannel(id: String)
        case openCategory(category: String)
    }

    public init(
        id: String,
        title: String,
        subtitle: String,
        image: String,
        isLocalImage: Bool = true,
        badgeText: String,
        actionType: ActionType,
        targetId: String? = nil
    ) {
        self.id = id
        self.title = title
        self.subtitle = subtitle
        self.image = image
        self.isLocalImage = isLocalImage
        self.badgeText = badgeText
        self.actionType = actionType
        self.targetId = targetId
    }
}
