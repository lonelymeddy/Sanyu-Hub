import SwiftUI

public struct HeroCarouselView: View {
    public let items: [HeroItem]
    public let onSelect: (HeroItem) -> Void

    @State private var currentIndex = 0
    private let timer = Timer.publish(every: 5, on: .main, in: .common).autoconnect()

    public init(items: [HeroItem], onSelect: @escaping (HeroItem) -> Void) {
        self.items = items
        self.onSelect = onSelect
    }

    public var body: some View {
        VStack(spacing: 10) {
            if !items.isEmpty {
                TabView(selection: $currentIndex) {
                    ForEach(0..<items.count, id: \.self) { index in
                        heroCard(items[index])
                            .tag(index)
                    }
                }
                .frame(height: 220)
                .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
                .onReceive(timer) { _ in
                    withAnimation(Theme.defaultAnimation) {
                        currentIndex = (currentIndex + 1) % items.count
                    }
                }

                // Page Indicator Dots
                HStack(spacing: 6) {
                    ForEach(0..<items.count, id: \.self) { index in
                        Circle()
                            .fill(index == currentIndex ? Theme.accent : Theme.surfaceElevated)
                            .frame(width: index == currentIndex ? 18 : 6, height: 6)
                    }
                }
            }
        }
    }

    private func heroCard(_ item: HeroItem) -> some View {
        ZStack(alignment: .bottomLeading) {
            DynamicAsyncImage(urlString: item.image, contentMode: .fill)
                .frame(maxWidth: .infinity, maxHeight: 220)
                .clipped()

            LinearGradient(
                gradient: Gradient(colors: [
                    Color.black.opacity(0.1),
                    Color.black.opacity(0.85)
                ]),
                startPoint: .top,
                endPoint: .bottom
            )

            VStack(alignment: .leading, spacing: 6) {
                BadgeView(type: .custom(text: item.badgeText, color: Theme.accent))

                Text(item.title)
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(.white)

                Text(item.subtitle)
                    .font(.caption)
                    .foregroundColor(Theme.textSecondary)
                    .lineLimit(2)

                Button(action: { onSelect(item) }) {
                    HStack(spacing: 6) {
                        Image(systemName: "play.fill")
                            .font(.caption)
                        Text("Explore")
                            .font(.caption)
                            .fontWeight(.bold)
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Theme.accent)
                    .cornerRadius(20)
                }
                .padding(.top, 4)
            }
            .padding(16)
        }
        .cornerRadius(Theme.cornerRadiusLarge)
        .overlay(
            RoundedRectangle(cornerRadius: Theme.cornerRadiusLarge)
                .stroke(Theme.border, lineWidth: 1)
        )
    }
}
