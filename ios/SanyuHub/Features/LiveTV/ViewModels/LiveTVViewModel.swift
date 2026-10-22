import SwiftUI
import Combine

@MainActor
public class LiveTVViewModel: ObservableObject {
    public enum ChannelType: String, CaseIterable, Identifiable {
        case tv = "TV Channels"
        case kids = "Kids TV"
        case radio = "Radio"
        case matches = "Live Matches"
        case crusades = "Crusades"

        public var id: String { self.rawValue }

        public var typeKey: String {
            switch self {
            case .tv: return "tv"
            case .kids: return "kids"
            case .radio: return "radio"
            case .matches: return "matches"
            case .crusades: return "crusades"
            }
        }
    }

    @Published public var selectedType: ChannelType = .tv
    @Published public var searchQuery: String = ""
    @Published public var channels: [LiveChannel] = []

    private let repository: LiveTVRepositoryProtocol

    public init(repository: LiveTVRepositoryProtocol = LiveTVRepository()) {
        self.repository = repository
        loadChannels()
    }

    public func loadChannels() {
        self.channels = repository.getChannels(
            byType: selectedType.typeKey,
            search: searchQuery.isEmpty ? nil : searchQuery
        )
    }

    public func selectType(_ type: ChannelType) {
        selectedType = type
        loadChannels()
    }
}
