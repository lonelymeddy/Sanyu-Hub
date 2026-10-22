import SwiftUI
import AVFoundation
import Combine

@MainActor
public class PlayerViewModel: ObservableObject {
    @Published public var player: AVPlayer?
    @Published public var isPlaying = false
    @Published public var isMuted = false
    @Published public var currentTime: Double = 0.0
    @Published public var duration: Double = 0.0
    @Published public var isLoading = true
    @Published public var errorMessage: String?

    private var timeObserver: Any?
    private var cancellables = Set<AnyCancellable>()

    public init() {}

    public func setupPlayer(with media: AppEnvironment.PlayerMedia) {
        guard let urlString = media.streamUrl, let url = URL(string: urlString) else {
            self.errorMessage = "Playback stream URL unavailable for \(media.title)."
            self.isLoading = false
            return
        }

        AudioSessionManager.shared.configurePlaybackAudioSession()

        let playerItem = AVPlayerItem(url: url)
        let avPlayer = AVPlayer(playerItem: playerItem)
        self.player = avPlayer

        // Add periodic time observer
        timeObserver = avPlayer.addPeriodicTimeObserver(forInterval: CMTime(seconds: 0.5, preferredTimescale: 600), queue: .main) { [weak self] time in
            Task { @MainActor [weak self] in
                guard let self = self else { return }
                self.currentTime = time.seconds
                if let currentItem = self.player?.currentItem, currentItem.duration.seconds.isFinite {
                    self.duration = currentItem.duration.seconds
                }
            }
        }

        // Observe status
        playerItem.publisher(for: \.status)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] status in
                guard let self = self else { return }
                switch status {
                case .readyToPlay:
                    self.isLoading = false
                    self.play()
                case .failed:
                    self.isLoading = false
                    self.errorMessage = "Failed to load media stream."
                default:
                    break
                }
            }
            .store(in: &cancellables)
    }

    public func play() {
        player?.play()
        isPlaying = true
    }

    public func pause() {
        player?.pause()
        isPlaying = false
    }

    public func togglePlayPause() {
        if isPlaying {
            pause()
        } else {
            play()
        }
    }

    public func seek(to timeInSeconds: Double) {
        let time = CMTime(seconds: timeInSeconds, preferredTimescale: 600)
        player?.seek(to: time)
    }

    public func rewind10() {
        let target = max(0.0, currentTime - 10.0)
        seek(to: target)
    }

    public func forward10() {
        let target = min(duration, currentTime + 10.0)
        seek(to: target)
    }

    public func toggleMute() {
        isMuted.toggle()
        player?.isMuted = isMuted
    }

    public func cleanup() {
        if let observer = timeObserver, let player = player {
            player.removeTimeObserver(observer)
            timeObserver = nil
        }
        player?.pause()
        player = nil
        cancellables.removeAll()
    }
}
