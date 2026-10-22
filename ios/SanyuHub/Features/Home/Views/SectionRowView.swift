import SwiftUI

public struct SectionRowHeader: View {
    public let title: String
    public let iconName: String
    public let onSeeAll: (() -> Void)?

    public init(title: String, iconName: String = "flame.fill", onSeeAll: (() -> Void)? = nil) {
        self.title = title
        self.iconName = iconName
        self.onSeeAll = onSeeAll
    }

    public var body: some View {
        HStack {
            HStack(spacing: 8) {
                Image(systemName: iconName)
                    .font(.subheadline)
                    .foregroundColor(Theme.accent)

                Text(title)
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(Theme.textPrimary)
            }

            Spacer()

            if let onSeeAll = onSeeAll {
                Button(action: onSeeAll) {
                    HStack(spacing: 4) {
                        Text("See All")
                            .font(.caption)
                            .fontWeight(.semibold)
                        Image(systemName: "chevron.right")
                            .font(.caption2)
                    }
                    .foregroundColor(Theme.accent)
                }
            }
        }
    }
}
