import SwiftUI

public struct PosterCardView: View {
    public let title: String
    public let posterUrl: String?
    public let vj: String?
    public let rating: Double?
    public let year: Int?
    public let action: () -> Void

    public init(
        title: String,
        posterUrl: String?,
        vj: String? = nil,
        rating: Double? = nil,
        year: Int? = nil,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.posterUrl = posterUrl
        self.vj = vj
        self.rating = rating
        self.year = year
        self.action = action
    }

    public var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 6) {
                ZStack(alignment: .topTrailing) {
                    DynamicAsyncImage(urlString: posterUrl, contentMode: .fill)
                        .frame(maxWidth: .infinity)
                        .aspectRatio(2.0 / 3.0, contentMode: .fit)
                        .clipped()
                        .cornerRadius(Theme.cornerRadiusMedium)
                        .overlay(
                            RoundedRectangle(cornerRadius: Theme.cornerRadiusMedium)
                                .stroke(Theme.border.opacity(0.5), lineWidth: 1)
                        )

                    if let vj = vj, !vj.isEmpty {
                        BadgeView(type: .vj(name: vj))
                            .padding(6)
                    }
                }

                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(Theme.textPrimary)
                    .lineLimit(1)

                HStack(spacing: 8) {
                    if let rating = rating, rating > 0 {
                        BadgeView(type: .rating(value: rating))
                    }

                    if let year = year, year > 0 {
                        Text("\(year)")
                            .font(.caption2)
                            .foregroundColor(Theme.textMuted)
                    }
                }
            }
        }
        .buttonStyle(PlainButtonStyle())
    }
}
