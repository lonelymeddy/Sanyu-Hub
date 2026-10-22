import Foundation
import AVFoundation

public class AudioSessionManager {
    public static let shared = AudioSessionManager()

    private init() {}

    public func configurePlaybackAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .moviePlayback, options: [.allowAirPlay, .mixWithOthers])
            try session.setActive(true)
        } catch {
            print("Failed to set audio session category: \(error.localizedDescription)")
        }
    }

    public func configureRadioAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default, options: [.allowAirPlay, .allowBluetooth])
            try session.setActive(true)
        } catch {
            print("Failed to set radio audio session category: \(error.localizedDescription)")
        }
    }
}
