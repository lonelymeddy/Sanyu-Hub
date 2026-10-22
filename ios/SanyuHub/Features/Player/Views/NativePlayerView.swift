import SwiftUI
import AVKit

public struct NativePlayerView: View {
    public let media: AppEnvironment.PlayerMedia

    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = PlayerViewModel()
    @State private var showControls = true

    public init(media: AppEnvironment.PlayerMedia) {
        self.media = media
    }

    public var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            if let player = viewModel.player {
                VideoPlayerContainerView(player: player)
                    .ignoresSafeArea()
                    .onTapGesture {
                        withAnimation {
                            showControls.toggle()
                        }
                    }

                if showControls {
                    CustomPlayerControlsView(viewModel: viewModel, title: media.title) {
                        viewModel.cleanup()
                        dismiss()
                    }
                    .transition(.opacity)
                }
            } else if viewModel.isLoading {
                VStack(spacing: 12) {
                    ProgressView()
                        .tint(Theme.accent)
                    Text("Connecting to stream...")
                        .font(.subheadline)
                        .foregroundColor(.white)
                }
            } else if let error = viewModel.errorMessage {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 48))
                        .foregroundColor(Theme.accent)

                    Text("Playback Error")
                        .font(.headline)
                        .foregroundColor(.white)

                    Text(error)
                        .font(.subheadline)
                        .foregroundColor(Theme.textSecondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)

                    Button("Close") {
                        dismiss()
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 10)
                    .background(Theme.surfaceElevated)
                    .cornerRadius(8)
                }
            }
        }
        .onAppear {
            viewModel.setupPlayer(with: media)
        }
        .onDisappear {
            viewModel.cleanup()
        }
    }
}

struct VideoPlayerContainerView: UIViewControllerRepresentable {
    let player: AVPlayer

    func makeUIViewController(context: Context) -> AVPlayerViewController {
        let controller = AVPlayerViewController()
        controller.player = player
        controller.showsPlaybackControls = false
        controller.videoGravity = .resizeAspect
        return controller
    }

    func updateUIViewController(_ uiViewController: AVPlayerViewController, context: Context) {
        uiViewController.player = player
    }
}
