import SwiftUI

public struct SkeletonView: View {
    @State private var phase: CGFloat = -0.8

    public init() {}

    public var body: some View {
        GeometryReader { geometry in
            Rectangle()
                .fill(Theme.surface)
                .overlay(
                    Rectangle()
                        .fill(
                            LinearGradient(
                                gradient: Gradient(colors: [
                                    Color.white.opacity(0.0),
                                    Color.white.opacity(0.12),
                                    Color.white.opacity(0.0)
                                ]),
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .rotationEffect(.degrees(20))
                        .offset(x: phase * geometry.size.width)
                )
                .clipped()
        }
        .onAppear {
            withAnimation(Animation.linear(duration: 1.5).repeatForever(autoreverses: false)) {
                phase = 1.2
            }
        }
    }
}
