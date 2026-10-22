import SwiftUI

public struct CustomPlayerControlsView: View {
    @ObservedObject public var viewModel: PlayerViewModel
    public let title: String
    public let onClose: () -> Void

    public init(viewModel: PlayerViewModel, title: String, onClose: @escaping () -> Void) {
        self.viewModel = viewModel
        self.title = title
        self.onClose = onClose
    }

    public var body: some View {
        VStack {
            // Header Top Bar
            HStack {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .lineLimit(1)

                Spacer()

                Button(action: onClose) {
                    Image(systemName: "xmark")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.white)
                        .padding(8)
                        .background(Color.black.opacity(0.6))
                        .clipShape(Circle())
                }
            }
            .padding(16)

            Spacer()

            // Center Play/Pause Controls
            HStack(spacing: 36) {
                Button(action: { viewModel.rewind10() }) {
                    Image(systemName: "goforward.10")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundColor(.white)
                        .scaleEffect(x: -1, y: 1) // -10s rewind
                }

                Button(action: { viewModel.togglePlayPause() }) {
                    Image(systemName: viewModel.isPlaying ? "pause.circle.fill" : "play.circle.fill")
                        .font(.system(size: 56))
                        .foregroundColor(Theme.accent)
                }

                Button(action: { viewModel.forward10() }) {
                    Image(systemName: "goforward.10")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundColor(.white)
                }
            }

            Spacer()

            // Bottom Timeline & Volume
            VStack(spacing: 8) {
                if viewModel.duration > 0 {
                    HStack(spacing: 12) {
                        Text(formatTime(viewModel.currentTime))
                            .font(.caption2)
                            .foregroundColor(.white)

                        Slider(
                            value: Binding(
                                get: { viewModel.currentTime },
                                set: { viewModel.seek(to: $0) }
                            ),
                            in: 0...max(1.0, viewModel.duration)
                        )
                        .tint(Theme.accent)

                        Text(formatTime(viewModel.duration))
                            .font(.caption2)
                            .foregroundColor(.white)
                    }
                }

                HStack {
                    Button(action: { viewModel.toggleMute() }) {
                        Image(systemName: viewModel.isMuted ? "speaker.slash.fill" : "speaker.wave.2.fill")
                            .font(.system(size: 18))
                            .foregroundColor(.white)
                    }

                    Spacer()
                }
            }
            .padding(16)
        }
        .background(
            LinearGradient(
                gradient: Gradient(colors: [
                    Color.black.opacity(0.7),
                    Color.clear,
                    Color.black.opacity(0.85)
                ]),
                startPoint: .top,
                endPoint: .bottom
            )
        )
    }

    private func formatTime(_ seconds: Double) -> String {
        guard seconds.isFinite && !seconds.isNaN else { return "00:00" }
        let total = Int(seconds)
        let mins = total / 60
        let secs = total % 60
        return String(format: "%02d:%02d", mins, secs)
    }
}
