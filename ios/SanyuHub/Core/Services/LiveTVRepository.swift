import Foundation

public protocol LiveTVRepositoryProtocol {
    func getAllChannels() -> [LiveChannel]
    func getChannel(byId id: String) -> LiveChannel?
    func getChannels(byType type: String, search: String?) -> [LiveChannel]
    func getViewerCount(for channelId: String) async throws -> ViewerCountResponse
    func getEpg(for channelId: String) async throws -> EpgResponse
}

public class LiveTVRepository: LiveTVRepositoryProtocol {
    private let networkService: NetworkServiceProtocol

    public static let defaultChannels: [LiveChannel] = [
        LiveChannel(
            id: "ntv-uganda",
            name: "NTV Uganda",
            category: "news",
            categoryLabel: "News & General",
            logo: "https://sanyuhub.com/images/ntv-logo.jpg",
            streamType: "hls",
            streamUrl: "https://ams-2629.antmedia.cloud/LiveApp/streams/abul2026.m3u8",
            meta: "Official Live Broadcast • HD • News & Shows",
            description: "NTV Uganda brings you live breaking news, current affairs, talk shows, and top Ugandan entertainment."
        ),
        LiveChannel(
            id: "spark-tv",
            name: "Spark TV",
            category: "entertainment",
            categoryLabel: "Entertainment & Lifestyle",
            logo: "https://sanyuhub.com/images/spark-logo.png",
            streamType: "hls",
            streamUrl: "https://ams-2629.antmedia.cloud/LiveApp/streams/spark2026.m3u8",
            meta: "Official Live Broadcast • HD • Movies & Lifestyle",
            description: "Spark TV Uganda is your home for celebrity gossip, music, local drama series, and women lifestyle programming."
        ),
        LiveChannel(
            id: "bukedde-1",
            name: "Bukedde 1",
            category: "news",
            categoryLabel: "Luganda & News",
            logo: "https://sanyuhub.com/images/bukedde1-logo.png",
            streamType: "hls",
            streamUrl: "https://video.visiongroup.co.ug/bukedde1/index.m3u8",
            meta: "Vision Group • Luganda Broadcast",
            description: "Bukedde TV 1 delivers premium Luganda news, local drama, cultural shows, and community programming."
        ),
        LiveChannel(
            id: "bukedde-2",
            name: "Bukedde 2",
            category: "entertainment",
            categoryLabel: "Luganda Entertainment",
            logo: "https://sanyuhub.com/images/bukedde2-logo.jpg",
            streamType: "hls",
            streamUrl: "https://video.visiongroup.co.ug/bukedde2/index.m3u8",
            meta: "Vision Group • Luganda Movies & Music",
            description: "Bukedde TV 2 features non-stop Luganda translated movies, sports highlights, and music shows."
        ),
        LiveChannel(
            id: "tv-west",
            name: "TV West",
            category: "regional",
            categoryLabel: "Western Uganda Broadcast",
            logo: "https://sanyuhub.com/images/tvwest-logo.jpg",
            streamType: "hls",
            streamUrl: "https://video.visiongroup.co.ug/tvwest/index.m3u8",
            meta: "Runyankole / Rukiga • News & Culture",
            description: "TV West covers Western Uganda with regional news, traditional music, and local lifestyle content."
        ),
        LiveChannel(
            id: "bbs-terefayina",
            name: "BBS Terefayina",
            category: "general",
            categoryLabel: "Kingdom Broadcast",
            logo: "https://sanyuhub.com/images/bbs-logo.jpg",
            streamType: "hls",
            streamUrl: "https://ams-2629.antmedia.cloud/LiveApp/streams/bbs2026.m3u8",
            meta: "Buganda Kingdom • Cultural & News",
            description: "BBS Terefayina is the official broadcaster of the Buganda Kingdom delivering news, drama, and culture."
        ),
        LiveChannel(
            id: "galaxy-tv",
            name: "Galaxy TV",
            category: "youth",
            categoryLabel: "Youth & Urban Culture",
            logo: "https://sanyuhub.com/images/galaxytv-logo.png",
            streamType: "hls",
            streamUrl: "https://livestream.galaxytv.ug/jikonkone/playlist.m3u8",
            meta: "Zzina Broadcast • Urban Music & Trends",
            description: "Galaxy TV brings non-stop urban dancehall, Afrobeats, celebrity trends, and youth entertainment."
        ),
        LiveChannel(
            id: "wanluo-tv",
            name: "Wanluo TV",
            category: "regional",
            categoryLabel: "Northern Uganda Broadcast",
            logo: "https://sanyuhub.com/images/wanluo-logo.jpg",
            streamType: "hls",
            streamUrl: "https://ams-2629.antmedia.cloud/LiveApp/streams/wanluo2026.m3u8",
            meta: "Luo Language • Culture & News",
            description: "Wanluo TV serves Northern Uganda with Luo news, traditional arts, lifestyle, and community developments."
        ),
        LiveChannel(
            id: "b4u-movies",
            name: "B4U Movies",
            category: "movies",
            categoryLabel: "Bollywood & Movies",
            logo: "https://sanyuhub.com/images/b4u-movies-logo.jpg",
            streamType: "hls",
            streamUrl: "https://b4umovies.b-cdn.net/stream.m3u8",
            meta: "24/7 Bollywood • Classic & Modern Cinema",
            description: "B4U Movies streams classic and modern Bollywood cinema, movie retrospectives, and star interviews."
        ),
        LiveChannel(
            id: "cnn",
            name: "CNN International",
            category: "news",
            categoryLabel: "Global News",
            logo: "https://sanyuhub.com/images/cnn-logo.png",
            streamType: "hls",
            streamUrl: "https://cnn-cnninternational-1-mwx.samsung.wurl.tv/manifest/playlist.m3u8",
            meta: "24/7 World News • Live Breaking Coverage",
            description: "CNN International offers live worldwide news coverage, international affairs, and global analysis."
        ),
        LiveChannel(
            id: "telemundo",
            name: "Telemundo",
            category: "entertainment",
            categoryLabel: "Telenovelas & Drama",
            logo: "https://sanyuhub.com/images/telemundo-logo.png",
            streamType: "hls",
            streamUrl: "https://linear-411.frequency.stream/dist/xumo/411/hls/master/playlist.m3u8",
            meta: "Telenovelas • Drama Series",
            description: "Telemundo features drama series, telenovelas, reality entertainment, and Spanish-language pop culture."
        ),
        LiveChannel(
            id: "fifa-plus",
            name: "FIFA+",
            category: "sports",
            categoryLabel: "World Football & Sports",
            logo: "https://sanyuhub.com/images/fifa-plus-logo.png",
            streamType: "hls",
            streamUrl: "https://fifaplus-1-us.samsung.wurl.tv/manifest/playlist.m3u8",
            meta: "Official FIFA Stream • Match Archives & Live",
            description: "FIFA+ streams world football archives, original sports documentaries, live matches, and league highlights."
        ),
        LiveChannel(
            id: "base2tv",
            name: "Base 2 TV",
            category: "entertainment",
            categoryLabel: "Local Entertainment",
            logo: "https://sanyuhub.com/images/base2tv-logo.png",
            streamType: "hls",
            streamUrl: "https://ams-2629.antmedia.cloud/LiveApp/streams/base2tv.m3u8",
            meta: "Local Music & Movies",
            description: "Base 2 TV broadcasts local Ugandan music videos, translated movies, and urban street culture."
        ),
        LiveChannel(
            id: "kbs-tv",
            name: "KBS World",
            category: "entertainment",
            categoryLabel: "K-Drama & K-Pop",
            logo: "https://sanyuhub.com/images/kbstv-logo.png",
            streamType: "hls",
            streamUrl: "https://kbs-kbs-world-1-us.samsung.wurl.tv/manifest/playlist.m3u8",
            meta: "Korean Dramas • K-Pop Music Shows",
            description: "KBS World delivers Korean dramas, K-pop countdowns, variety entertainment, and cultural specials."
        ),
        LiveChannel(
            id: "cartoon-network",
            name: "Cartoon Network",
            category: "kids",
            categoryLabel: "Children Animation",
            logo: "https://sanyuhub.com/images/cartoon-network-logo.png",
            streamType: "hls",
            streamUrl: "https://cartoonnetwork-1-us.samsung.wurl.tv/manifest/playlist.m3u8",
            meta: "Animated Series • Kids & Family",
            description: "Cartoon Network features hit animated series, comedy cartoons, and family adventure shows."
        ),
        LiveChannel(
            id: "kidsflix",
            name: "Kidsflix",
            category: "kids",
            categoryLabel: "Kids Animation",
            logo: "https://sanyuhub.com/images/kidsflix-logo.png",
            streamType: "hls",
            streamUrl: "https://kidsflix-1-us.samsung.wurl.tv/manifest/playlist.m3u8",
            meta: "Cartoons & Children Content",
            description: "Kidsflix streams safe, fun, and educational cartoon shows for children of all ages."
        ),
        LiveChannel(
            id: "pbs-kids",
            name: "PBS Kids",
            category: "kids",
            categoryLabel: "Educational Cartoons",
            logo: "https://sanyuhub.com/images/pbs-kids-pacific-logo.png",
            streamType: "hls",
            streamUrl: "https://pbskids-1-us.samsung.wurl.tv/manifest/playlist.m3u8",
            meta: "Educational Shows • Preschool & Kids",
            description: "PBS Kids presents learning-focused animated programming, creative play, and preschool entertainment."
        ),
        LiveChannel(
            id: "tom-and-jerry",
            name: "Tom & Jerry Channel",
            category: "kids",
            categoryLabel: "Classic Comedy Animation",
            logo: "https://sanyuhub.com/images/tom-and-jerry-2-logo.jpg",
            streamType: "hls",
            streamUrl: "https://tomandjerry-1-us.samsung.wurl.tv/manifest/playlist.m3u8",
            meta: "24/7 Classic Slapstick Cartoon",
            description: "24/7 non-stop classic Tom and Jerry animated shorts, movies, and hilarious adventures."
        ),
        LiveChannel(
            id: "smurf-tv",
            name: "Smurf TV",
            category: "kids",
            categoryLabel: "Kids Animated Classics",
            logo: "https://sanyuhub.com/images/smurf-tv-logo.png",
            streamType: "hls",
            streamUrl: "https://smurftv-1-us.samsung.wurl.tv/manifest/playlist.m3u8",
            meta: "Classic Smurfs Animation",
            description: "Watch the magical adventures of the Smurfs in non-stop animated cartoon episodes."
        ),
        LiveChannel(
            id: "baby-shark",
            name: "Baby Shark TV",
            category: "kids",
            categoryLabel: "Toddler & Sing-Along",
            logo: "https://sanyuhub.com/images/baby-shark-logo.png",
            streamType: "hls",
            streamUrl: "https://babyshark-1-us.samsung.wurl.tv/manifest/playlist.m3u8",
            meta: "Sing-Along Songs • Preschool Fun",
            description: "Baby Shark TV brings colorful animated nursery rhymes, dance routines, and preschool songs."
        ),
        LiveChannel(
            id: "moonbug-kids",
            name: "Moonbug Kids",
            category: "kids",
            categoryLabel: "CoComelon & Friends",
            logo: "https://sanyuhub.com/images/moonbug-logo.jpg",
            streamType: "hls",
            streamUrl: "https://moonbugkids-1-us.samsung.wurl.tv/manifest/playlist.m3u8",
            meta: "CoComelon • Blippi • Little Baby Bum",
            description: "Moonbug Kids streams CoComelon, Blippi, Morphle, and hit preschool entertainment."
        ),
        LiveChannel(
            id: "lego-channel",
            name: "The Lego Channel",
            category: "kids",
            categoryLabel: "Lego Animation & Building",
            logo: "https://sanyuhub.com/images/lego-channel-logo.png",
            streamType: "hls",
            streamUrl: "https://thelegochannel-1-us.samsung.wurl.tv/manifest/playlist.m3u8",
            meta: "Lego Ninjago • Friends • City",
            description: "The Lego Channel features Lego Ninjago, Lego City, animation specials, and creative building."
        ),
        LiveChannel(
            id: "toon-goggles",
            name: "Toon Goggles",
            category: "kids",
            categoryLabel: "Kids Animation & Games",
            logo: "https://sanyuhub.com/images/toongoggles-logo.png",
            streamType: "hls",
            streamUrl: "https://toongoggles-1-us.samsung.wurl.tv/manifest/playlist.m3u8",
            meta: "On-Demand Cartoons & Live Streams",
            description: "Toon Goggles streams animated cartoon series, educational shows, and kid-safe gaming content."
        ),
        LiveChannel(
            id: "minimax",
            name: "Minimax Channel",
            category: "kids",
            categoryLabel: "European Animation",
            logo: "https://sanyuhub.com/images/minimax-logo.png",
            streamType: "hls",
            streamUrl: "https://minimax-1-us.samsung.wurl.tv/manifest/playlist.m3u8",
            meta: "Family & Children Entertainment",
            description: "Minimax Channel streams family animated series, wholesome adventure stories, and children classics."
        ),
        LiveChannel(
            id: "galaxy-fm",
            name: "100.2 Galaxy FM",
            category: "radio",
            categoryLabel: "Urban Dancehall & Afrobeats",
            logo: "https://sanyuhub.com/images/galaxyfm-logo.png",
            streamType: "audio",
            streamUrl: "https://stream.galaxyfm.co.ug/live.mp3",
            meta: "Kampala • 100.2 FM • Zzina",
            description: "Uganda's number one urban youth radio station streaming live club hits, dancehall, and celeb talk.",
            isRadio: true,
            type: "radio"
        ),
        LiveChannel(
            id: "dembe-fm",
            name: "90.4 Dembe FM",
            category: "radio",
            categoryLabel: "Luganda Music & Talk",
            logo: "https://sanyuhub.com/images/dembefm-logo.jpg",
            streamType: "audio",
            streamUrl: "https://stream.dembefm.co.ug/live.mp3",
            meta: "Kampala • 90.4 FM • Luganda",
            description: "Dembe FM features classic Ugandan love songs, social commentary, and family entertainment.",
            isRadio: true,
            type: "radio"
        ),
        LiveChannel(
            id: "trace-mziki",
            name: "Trace Mziki",
            category: "music",
            categoryLabel: "East African Music Videos",
            logo: "https://sanyuhub.com/images/tracemziki-logo.png",
            streamType: "hls",
            streamUrl: "https://tracemziki-1-us.samsung.wurl.tv/manifest/playlist.m3u8",
            meta: "24/7 East African Hits & Video Countdown",
            description: "Trace Mziki plays East African music videos, bongo flava, Ugandan Afrobeats, and dance countdowns."
        )
    ]

    public init(networkService: NetworkServiceProtocol = NetworkService()) {
        self.networkService = networkService
    }

    public func getAllChannels() -> [LiveChannel] {
        return Self.defaultChannels
    }

    public func getChannel(byId id: String) -> LiveChannel? {
        let cleanId = id.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        return Self.defaultChannels.first { ch in
            ch.id.lowercased() == cleanId || (ch.aliases?.contains { $0.lowercased() == cleanId } ?? false)
        }
    }

    public func getChannels(byType type: String, search: String? = nil) -> [LiveChannel] {
        let cleanType = type.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let cleanSearch = (search ?? "").trimmingCharacters(in: .whitespacesAndNewlines).lowercased()

        var channels = Self.defaultChannels

        if cleanType == "kids" {
            channels = channels.filter { $0.category == "kids" || $0.type == "kids" }
        } else if cleanType == "radio" {
            channels = channels.filter { ($0.isRadio == true) || $0.type == "radio" || $0.category == "radio" }
        } else if cleanType == "matches" {
            channels = channels.filter { $0.type == "matches" || $0.category == "matches" }
        } else if cleanType == "crusades" {
            channels = channels.filter { $0.type == "crusades" || $0.category == "crusades" }
        } else {
            // Default: 'tv' - shows all TV channels (non-radio, non-matches, non-crusades)
            channels = channels.filter {
                !($0.isRadio == true) &&
                $0.type != "radio" &&
                $0.category != "radio" &&
                $0.category != "matches" &&
                $0.type != "matches" &&
                $0.category != "crusades" &&
                $0.type != "crusades"
            }
        }

        if !cleanSearch.isEmpty {
            channels = channels.filter { $0.name.lowercased().contains(cleanSearch) }
        }

        return channels
    }

    public func getViewerCount(for channelId: String) async throws -> ViewerCountResponse {
        do {
            return try await networkService.fetch(.getLiveTvViewers(channelId: channelId))
        } catch {
            return ViewerCountResponse(channelId: channelId, viewers: nil, message: "Viewers unavailable")
        }
    }

    public func getEpg(for channelId: String) async throws -> EpgResponse {
        do {
            return try await networkService.fetch(.getLiveTvEpg(channelId: channelId))
        } catch {
            return EpgResponse(channelId: channelId, schedule: [], message: "Programme schedule currently unavailable.")
        }
    }
}
