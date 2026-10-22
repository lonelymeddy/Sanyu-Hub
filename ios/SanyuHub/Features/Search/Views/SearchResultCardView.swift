import SwiftUI

public struct SearchResultCardView: View {
    public let title: String
    public let subtitle: String?
    public let imageUrl: String?
    public let badgeText: String
    public let action: () -> Void

    public init(
        title: String,
        subtitle: String?,
        imageUrl: String?,
        badgeText: String,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.subtitle = subtitle
        self.imageUrl = imageUrl
        self.badgeText = badgeText
        self.action = action
    }

    public var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                DynamicAsyncImage(urlString: imageUrl, contentMode: .fill)
                    .frame(width: 60, height: 80)
                    .clipped()
                    .cornerRadius(6)

                VStack(alignment: .leading, spacing: 4) {
                    BadgeView(type: .custom(text: badgeText, color: Theme.accent))

                    Text(title)
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(Theme.textPrimary)
                        .lineLimit(1)

                    if let subtitle = subtitle, !subtitle.isEmpty {
                        Text(subtitle)
                            .font(.caption)
                            .foregroundColor(Theme.textSecondary)
                            .lineLimit(1)
                    }
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(Theme.textMuted)
            }
            .padding(10)
            .background(Theme.surface)
            .cornerRadius(Theme.cornerRadiusMedium)
            .overlay(
                RoundedRectangle(cornerRadius: Theme.cornerRadiusMedium)
                    .stroke(Theme.border, lineWidth: 1)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}
