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
            embedUrl: "https://ams-2629.antmedia.cloud/LiveApp/play.html?id=abul2026",
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
            embedUrl: "https://ams-2629.antmedia.cloud/LiveApp/play.html?id=spark2026",
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
            streamUrl: "https://stream.hydeinnovations.com:443/bukedde1flussonic/index.m3u8",
            embedUrl: "https://www.bukedde.co.ug/tv/4",
            meta: "Official Live Broadcast • HD • Luganda News & Shows",
            description: "Bukedde 1 TV delivers top Luganda news, live events, traditional culture, and family entertainment across Uganda."
        ),
        LiveChannel(
            id: "bukedde-2",
            name: "Bukedde 2",
            category: "entertainment",
            categoryLabel: "Music & Sports",
            logo: "https://sanyuhub.com/images/bukedde2-logo.jpg",
            streamType: "hls",
            streamUrl: "https://stream.hydeinnovations.com:443/bukedde2flussonic/index.m3u8",
            embedUrl: "https://www.bukedde.co.ug/tv/5",
            meta: "Official Live Broadcast • HD • Music & Sports",
            description: "Bukedde 2 offers vibrant Luganda music programming, sports coverage, and youth entertainment."
        ),
        LiveChannel(
            id: "tv-west",
            name: "TV West",
            category: "news",
            categoryLabel: "Western Region & News",
            logo: "https://sanyuhub.com/images/tvwest-logo.jpg",
            streamType: "hls",
            streamUrl: "https://stream.hydeinnovations.com:443/tvwest-flussonic/index.m3u8",
            embedUrl: "https://www.bukedde.co.ug/tv/6",
            meta: "Official Live Broadcast • HD • Runyankole & News",
            description: "TV West is the leading television station for Western Uganda, broadcasting local news, culture, and entertainment in Runyankole."
        ),
        LiveChannel(
            id: "wan-luo-tv",
            name: "Wan Luo TV",
            category: "entertainment",
            categoryLabel: "Luo Culture & Shows",
            logo: "https://sanyuhub.com/images/wanluo-logo.jpg",
            streamType: "hls",
            streamUrl: "https://stream.hydeinnovations.com:443/luotv-flussonic/index.m3u8",
            embedUrl: "https://www.bukedde.co.ug/tv",
            meta: "Official Live Broadcast • HD • Luo Language & Shows",
            description: "Wan Luo TV is the premier Luo-language television channel broadcasting cultural programming, music, and news for Northern Uganda.",
            aliases: ["wan-luo"]
        ),
        LiveChannel(
            id: "bbs-terefayina",
            name: "BBS Terefayina",
            category: "news",
            categoryLabel: "Buganda & Cultural News",
            logo: "https://sanyuhub.com/images/bbs-logo.jpg",
            streamType: "hls",
            streamUrl: "https://bbstv.ug/hls/ch01/index.m3u8",
            embedUrl: "https://bbstv.ug/live/",
            meta: "Official Live Broadcast • HD • Buganda & News",
            description: "BBS Terefayina brings you live news, culture, entertainment, and current affairs from Buganda Kingdom and across Uganda."
        ),
        LiveChannel(
            id: "galaxy-tv",
            name: "Galaxy TV",
            category: "entertainment",
            categoryLabel: "Music, Movies & Gossip",
            logo: "https://sanyuhub.com/images/galaxytv-logo.png",
            streamType: "hls",
            streamUrl: "https://livestream.galaxytv.ug/jikonkone/playlist.m3u8",
            embedUrl: "https://galaxytv.ug/home",
            meta: "Official Live Broadcast • HD • Jikonkone",
            description: "Galaxy TV is Uganda's funkiest television station featuring the best music, movies, celebrity news, and entertainment."
        ),
        LiveChannel(
            id: "kbs-tv",
            name: "KBS TV Uganda",
            category: "news",
            categoryLabel: "News, Shows & Family",
            logo: "https://sanyuhub.com/images/kbstv-logo.png",
            streamType: "hls",
            streamUrl: "https://www.kbstv.co.ug/live/abr/master.m3u8",
            embedUrl: "https://www.kbstv.co.ug/",
            meta: "Official Live Broadcast • HD • Maaso ku Lutimbe",
            description: "KBS TV Uganda (Maaso ku Lutimbe) brings you live news, top entertainment, local talk shows, movies, and family programming.",
            aliases: ["kbs-tv-uganda", "kbs"]
        ),
        LiveChannel(
            id: "base2-tv",
            name: "Base2 TV",
            category: "entertainment",
            categoryLabel: "Luganda Entertainment & Movies",
            logo: "https://sanyuhub.com/images/base2tv-logo.png",
            streamType: "hls",
            streamUrl: "https://base2tv.ug/live/stream.m3u8",
            embedUrl: "https://base2tv.ug/",
            meta: "Official Live Broadcast • HD • Telefwunkeni",
            description: "Base2 TV (Telefwunkeni) delivers vibrant Luganda entertainment, translated blockbuster movies, youth shows, and local music.",
            aliases: ["base2"]
        ),
        LiveChannel(
            id: "trace-mziki",
            name: "Trace Mziki",
            category: "entertainment",
            categoryLabel: "East African Music & Culture",
            logo: "https://sanyuhub.com/images/tracemziki-logo.png",
            streamType: "hls",
            streamUrl: "https://channels.trace.plus/Traceprod/MZIKI_hd/index.m3u8",
            embedUrl: "https://bx-tv.com/watch/trace-mziki-893902",
            meta: "Official Live Broadcast • HD • We Love East African Music",
            description: "Trace Mziki is the ultimate music channel dedicated to East African music, featuring hit video countdowns, artist showcases, and urban culture.",
            aliases: ["tracemziki"]
        ),
        LiveChannel(
            id: "cartoon-network",
            name: "Cartoon Network",
            category: "kids",
            categoryLabel: "Animation & Kids Shows",
            logo: "https://sanyuhub.com/images/cartoon-network-logo.png",
            streamType: "hls",
            streamUrl: "https://vodzong.mjunoon.tv:8087/streamtest/cartoon-network-87/playlist.m3u8",
            embedUrl: "https://www.cartoonnetwork.com",
            meta: "Official Live Broadcast • HD • Cartoons & Animation",
            description: "Cartoon Network is home to top animated shows, classic cartoons, and kids entertainment.",
            aliases: ["cartoonnetwork", "cn"]
        ),
        LiveChannel(
            id: "baby-shark-tv",
            name: "Baby Shark TV",
            category: "kids",
            categoryLabel: "Children's Songs & Animation",
            logo: "https://sanyuhub.com/images/baby-shark-logo.png",
            streamType: "hls",
            streamUrl: "https://newidco-babysharktv-1-eu.rakuten.wurl.tv/playlist.m3u8",
            embedUrl: "https://www.pinkfong.com",
            meta: "Official Live Broadcast • HD • Kids & Nursery Rhymes",
            description: "Baby Shark TV features non-stop nursery rhymes, fun songs, educational animation, and kids entertainment.",
            aliases: ["babysharktv", "baby-shark", "babyshark"]
        ),
        LiveChannel(
            id: "pbs-kids-pacific",
            name: "PBS Kids Pacific",
            category: "kids",
            categoryLabel: "Educational & Kids TV",
            logo: "https://sanyuhub.com/images/pbs-kids-pacific-logo.png",
            streamType: "hls",
            streamUrl: "https://livestream.pbskids.org/out/v1/11f2e6b73eaa4887b3746cb863960e79/pst.m3u8",
            embedUrl: "https://pbskids.org",
            meta: "Official Live Broadcast • HD • Educational Shows",
            description: "PBS Kids Pacific delivers educational television, fun children's series, and inspiring programming.",
            aliases: ["pbskids", "pbs-kids"]
        ),
        LiveChannel(
            id: "telemundo",
            name: "Telemundo",
            category: "entertainment",
            categoryLabel: "Spanish Series & News",
            logo: "https://sanyuhub.com/images/telemundo-logo.png",
            streamType: "hls",
            streamUrl: "https://nbculocallive.akamaized.net/hls/live/2037499/puertorico/stream1/master_1080.m3u8",
            embedUrl: "https://www.telemundo.com",
            meta: "Official Live Broadcast • HD • Spanish Entertainment",
            description: "Telemundo offers premier Spanish-language telenovelas, live news, reality TV, and entertainment.",
            aliases: ["telemundo-pr"]
        ),
        LiveChannel(
            id: "b4u-movies",
            name: "B4U Movies",
            category: "entertainment",
            categoryLabel: "Bollywood & Indian Cinema",
            logo: "https://sanyuhub.com/images/b4u-movies-logo.jpg",
            streamType: "hls",
            streamUrl: "https://app.ncare.live/c3VydmVyX8RpbEU9Mi8xNy8yMDE0GIDU6RgzQ6NTAgdEoaeFzbF92YWxIZTO0U0ezN1IzMyfvcGVMZEJCTEFWeVN3PTOmdFsaWRtaW51aiPhnPTI2/channels.stream/live-orgin/channels.stream/playlist.m3u8",
            embedUrl: "https://b4umovies.co.uk",
            meta: "Official Live Broadcast • HD • Bollywood Blockbusters",
            description: "B4U Movies brings you premier Bollywood feature films, classic Hindi cinema, behind-the-scenes specials, and star interviews.",
            aliases: ["b4umovies", "b4u"]
        ),
        LiveChannel(
            id: "kidsflix",
            name: "KIDS FLIX",
            category: "kids",
            categoryLabel: "Children's Movies & Shows",
            logo: "https://sanyuhub.com/images/kidsflix-logo.png",
            streamType: "hls",
            streamUrl: "https://stream-us-east-1.getpublica.com/playlist.m3u8?network_id=50",
            embedUrl: "https://www.kidsflix.com",
            meta: "Official Live Broadcast • HD • Family & Kids Entertainment",
            description: "KIDS FLIX delivers continuous family-friendly animated movies, kids series, educational adventures, and fun entertainment.",
            aliases: ["kids-flix"]
        ),
        LiveChannel(
            id: "fifa-plus",
            name: "FB | FIFA+",
            category: "sports",
            categoryLabel: "International Football & Documentaries",
            logo: "https://sanyuhub.com/images/fifa-plus-logo.png",
            streamType: "hls",
            streamUrl: "https://37b4c228.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/UmFrdXRlblRWLWZyX0ZJRkFQbHVzRnJlbmNoX0hMUw/playlist.m3u8",
            embedUrl: "https://www.fifa.com/fifaplus",
            meta: "Official Live Broadcast • HD • FIFA Football & Highlights",
            description: "FB | FIFA+ brings you live international football coverage, classic match archives, player documentaries, and original sports series.",
            aliases: ["fb-fifa-plus", "fifaplus", "fifa"]
        ),
        LiveChannel(
            id: "cnn",
            name: "CNN",
            category: "news",
            categoryLabel: "Global News & World Affairs",
            logo: "https://sanyuhub.com/images/cnn-logo.png",
            streamType: "hls",
            streamUrl: "https://amg01448-samsungin-cnnnow-samsungin-4npqg.amagi.tv/playlist/amg01448-samsungin-cnnnow-samsungin/playlist.m3u8",
            embedUrl: "https://www.cnn.com",
            meta: "Official Live Broadcast • HD • Breaking News & World Affairs",
            description: "CNN delivers live global breaking news, expert political analysis, international reporting, and in-depth documentary coverage.",
            aliases: ["cnn-international", "cnn-news"]
        ),
        LiveChannel(
            id: "tom-and-jerry-2",
            name: "Tom and Jerry 2",
            category: "kids",
            categoryLabel: "Classic Animation & Cartoons",
            logo: "https://sanyuhub.com/images/tom-and-jerry-2-logo.jpg",
            streamType: "hls",
            streamUrl: "https://live20.bozztv.com/giatvplayout7/giatv-208314/playlist.m3u8",
            embedUrl: "https://www.cartoonnetwork.com",
            meta: "Official Live Broadcast • HD • Tom and Jerry Animated Stream",
            description: "Tom and Jerry 2 brings non-stop classic animated episodes, comical adventures, and timeless slapstick cartoon entertainment.",
            aliases: ["tomandjerry2", "tom-jerry-2"]
        ),
        LiveChannel(
            id: "dembe-fm",
            name: "Dembe FM",
            category: "radio",
            categoryLabel: "90.4 FM • Luganda Music & Shows",
            logo: "https://sanyuhub.com/images/dembefm-logo.jpg",
            streamType: "audio",
            streamUrl: "http://radio.dembefm.ug:8000/stream",
            embedUrl: "https://dembefm.ug",
            meta: "Official Live Broadcast • 90.4 FM",
            description: "Dembe FM is Uganda's premier Luganda music and entertainment radio station.",
            isRadio: true,
            type: "radio",
            aliases: ["dembefm", "dembe"]
        ),
        LiveChannel(
            id: "galaxy-fm",
            name: "Galaxy FM",
            category: "radio",
            categoryLabel: "100.2 FM • Zzina",
            logo: "https://sanyuhub.com/images/galaxyfm-logo.png",
            streamType: "audio",
            streamUrl: "https://stream.zeno.fm/ahtmyttw5mftv",
            embedUrl: "https://www.galaxyfm.co.ug/radio/",
            meta: "Official Live Broadcast • 100.2 FM Zzina",
            description: "Galaxy FM 100.2 Zzina is Uganda's leading youth urban music station.",
            isRadio: true,
            type: "radio",
            aliases: ["galaxyfm", "zzina"]
        ),
        LiveChannel(
            id: "bukedde-fm",
            name: "Bukedde FM",
            category: "radio",
            categoryLabel: "100.5 FM • Luganda News & Shows",
            logo: "https://newvision-media.s3.amazonaws.com/cms/491c5aed-a6d9-412c-85cf-fe4e090e2510.png",
            streamType: "audio",
            streamUrl: "https://stream.hydeinnovations.com:2020/stream/bukeddefm/stream",
            embedUrl: "https://www.bukedde.co.ug/radiolist",
            meta: "Official Live Broadcast • 100.5 FM",
            description: "Bukedde FM is Uganda's top Luganda radio station for news, talk shows, and local music.",
            isRadio: true,
            type: "radio",
            aliases: ["bukeddefm"]
        ),
        LiveChannel(
            id: "xfm",
            name: "XFM 94.8",
            category: "radio",
            categoryLabel: "94.8 FM • Top 40 Hits",
            logo: "https://newvision-media.s3.amazonaws.com/cms/cb5df600-7c65-49d3-95c4-2af6616eefc0.png",
            streamType: "audio",
            streamUrl: "https://stream.hydeinnovations.com:2020/stream/xfm/stream",
            embedUrl: "https://www.bukedde.co.ug/radiolist",
            meta: "Official Live Broadcast • 94.8 FM",
            description: "XFM 94.8 is a Top 40 hit music radio station based in Kampala, Uganda.",
            isRadio: true,
            type: "radio",
            aliases: ["xfm-948"]
        ),
        LiveChannel(
            id: "radio-west",
            name: "Radio West",
            category: "radio",
            categoryLabel: "100.2 FM • Western Region",
            logo: "https://newvision-media.s3.amazonaws.com/cms/64332ddd-eecd-47ce-899f-e7ebcff5a5a6.png",
            streamType: "audio",
            streamUrl: "https://stream.hydeinnovations.com:2020/stream/radiowest/stream",
            embedUrl: "https://www.bukedde.co.ug/radiolist",
            meta: "Official Live Broadcast • 100.2 FM",
            description: "Radio West is the leading radio station in Western Uganda.",
            isRadio: true,
            type: "radio",
            aliases: ["radiowest"]
        ),
        LiveChannel(
            id: "smurf-tv",
            name: "Smurf TV",
            category: "kids",
            categoryLabel: "Kids TV & Animation",
            logo: "https://sanyuhub.com/images/smurf-tv-logo.png",
            streamType: "hls",
            streamUrl: "https://stream.ads.ottera.tv/playlist.m3u8?network_id=4065",
            embedUrl: "https://stream.ads.ottera.tv/playlist.m3u8?network_id=4065",
            meta: "Official Live Broadcast • Animated Series",
            description: "Smurf TV brings non-stop Smurfs animated series, classic cartoons, and adventures from the Smurf Village.",
            aliases: ["smurftv", "smurfs-tv"]
        ),
        LiveChannel(
            id: "lego-channel",
            name: "The LEGO Channel",
            category: "kids",
            categoryLabel: "Kids TV & Animation",
            logo: "https://sanyuhub.com/images/lego-channel-logo.png",
            streamType: "hls",
            streamUrl: "https://dltiqboxjw21d.cloudfront.net/index.m3u8",
            embedUrl: "https://dltiqboxjw21d.cloudfront.net/index.m3u8",
            meta: "Official Live Broadcast • LEGO Animated Shows",
            description: "The LEGO Channel features exciting LEGO animated adventures, Ninjago, Friends, City, and creative brick-building entertainment.",
            aliases: ["the-lego-channel", "lego"]
        ),
        LiveChannel(
            id: "toongoggles",
            name: "ToonGoggles",
            category: "kids",
            categoryLabel: "Kids TV & Animation",
            logo: "https://sanyuhub.com/images/toongoggles-logo.png",
            streamType: "hls",
            streamUrl: "https://amg01329-otterainc-toongoggles-samsungau-ad-4c.amagi.tv/playlist/amg01329-otterainc-toongoggles-samsungau/playlist.m3u8",
            embedUrl: "https://amg01329-otterainc-toongoggles-samsungau-ad-4c.amagi.tv/playlist/amg01329-otterainc-toongoggles-samsungau/playlist.m3u8",
            meta: "Official Live Broadcast • Kids Shows & Cartoons",
            description: "ToonGoggles offers fun-filled animated series, games, and entertainment for children of all ages.",
            aliases: ["toon-goggles"]
        ),
        LiveChannel(
            id: "moonbug",
            name: "Moonbug",
            category: "kids",
            categoryLabel: "Kids TV & Animation",
            logo: "https://sanyuhub.com/images/moonbug-logo.jpg",
            streamType: "hls",
            streamUrl: "https://moonbug-rokuus.amagi.tv/playlist.m3u8",
            embedUrl: "https://moonbug-rokuus.amagi.tv/playlist.m3u8",
            meta: "Official Live Broadcast • CoComelon & Blippi",
            description: "Moonbug features popular children's shows including CoComelon, Blippi, Little Angel, Morphle, and educational songs.",
            aliases: ["moonbug-kids", "moonbugtv"]
        ),
        LiveChannel(
            id: "minimax",
            name: "MiniMax",
            category: "kids",
            categoryLabel: "Kids TV & Animation",
            logo: "https://sanyuhub.com/images/minimax-logo.png",
            streamType: "hls",
            streamUrl: "http://88.212.15.17/live/minimax_hun/index.m3u8",
            embedUrl: "http://88.212.15.17/live/minimax_hun/index.m3u8",
            meta: "Official Live Broadcast • Children's Television Network",
            description: "MiniMax delivers beloved children's television series, animated features, and educational family entertainment.",
            aliases: ["minimax-tv", "minimax-cee"]
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
