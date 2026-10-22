import SwiftUI

public struct ChannelCardView: View {
    public let channel: LiveChannel
    public let action: () -> Void

    public init(channel: LiveChannel, action: @escaping () -> Void) {
        self.channel = channel
        self.action = action
    }

    public var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 8) {
                ZStack(alignment: .topTrailing) {
                    DynamicAsyncImage(urlString: channel.logo, contentMode: .fit)
                        .frame(height: 110)
                        .frame(maxWidth: .infinity)
                        .background(Color(hex: 0x0D0D0D))
                        .cornerRadius(Theme.cornerRadiusMedium)
                        .overlay(
                            RoundedRectangle(cornerRadius: Theme.cornerRadiusMedium)
                                .stroke(Theme.border, lineWidth: 1)
                        )

                    BadgeView(type: channel.isRadio == true ? .radio : .live)
                        .padding(8)
                }

                HStack {
                    Text(channel.name)
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(Theme.textPrimary)
                        .lineLimit(1)

                    Spacer()
                }

                Text(channel.isRadio == true ? "Listen Live" : "Watch Live")
                    .font(.caption2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 6)
                    .background(Theme.surfaceElevated)
                    .cornerRadius(6)
            }
        }
        .buttonStyle(PlainButtonStyle())
    }
}
