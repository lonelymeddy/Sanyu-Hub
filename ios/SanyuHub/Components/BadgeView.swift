import SwiftUI

public enum BadgeType {
    case live
    case radio
    case vj(name: String)
    case rating(value: Double)
    case genre(name: String)
    case custom(text: String, color: Color)
}

public struct BadgeView: View {
    public let type: BadgeType

    public init(type: BadgeType) {
        self.type = type
    }

    public var body: some View {
        HStack(spacing: 4) {
            switch type {
            case .live:
                Circle()
                    .fill(Color.white)
                    .frame(width: 6, height: 6)
                Text("LIVE")
                    .font(.caption2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)

            case .radio:
                Image(systemName: "radio.fill")
                    .font(.caption2)
                    .foregroundColor(.white)
                Text("RADIO")
                    .font(.caption2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)

            case .vj(let name):
                Text("VJ \(name.uppercased())")
                    .font(.caption2)
                    .fontWeight(.bold)
                    .foregroundColor(Theme.gold)

            case .rating(let value):
                Image(systemName: "star.fill")
                    .font(.caption2)
                    .foregroundColor(Theme.gold)
                Text(String(format: "%.1f", value))
                    .font(.caption2)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)

            case .genre(let name):
                Text(name)
                    .font(.caption2)
                    .fontWeight(.medium)
                    .foregroundColor(Theme.textSecondary)

            case .custom(let text, _):
                Text(text)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
            }
        }
        .padding(.horizontal, 6)
        .padding(.vertical, 3)
        .background(backgroundForType)
        .cornerRadius(4)
    }

    private var backgroundForType: Color {
        switch type {
        case .live, .radio:
            return Theme.accent
        case .vj:
            return Color.black.opacity(0.75)
        case .rating:
            return Color.black.opacity(0.8)
        case .genre:
            return Theme.surfaceElevated
        case .custom(_, let color):
            return color
        }
    }
}
