import XCTest
@testable import SanyuHub

final class LiveChannelsTests: XCTestCase {
    func testAllDefaultChannelsPresent() {
        let repo = LiveTVRepository()
        let channels = repo.getAllChannels()

        XCTAssertGreaterThanOrEqual(channels.count, 30)

        let ntv = repo.getChannel(byId: "ntv-uganda")
        XCTAssertNotNil(ntv)
        XCTAssertEqual(ntv?.name, "NTV Uganda")
        XCTAssertEqual(ntv?.streamUrl, "https://ams-2629.antmedia.cloud/LiveApp/streams/abul2026.m3u8")

        let galaxyTv = repo.getChannel(byId: "galaxy-tv")
        XCTAssertNotNil(galaxyTv)
        XCTAssertEqual(galaxyTv?.streamUrl, "https://livestream.galaxytv.ug/jikonkone/playlist.m3u8")

        let dembeFm = repo.getChannel(byId: "dembe-fm")
        XCTAssertNotNil(dembeFm)
        XCTAssertTrue(dembeFm?.isRadio == true)

        let xfm = repo.getChannel(byId: "xfm")
        XCTAssertNotNil(xfm)
        XCTAssertTrue(xfm?.isRadio == true)
    }

    func testChannelFilteringByType() {
        let repo = LiveTVRepository()

        let kidsChannels = repo.getChannels(byType: "kids")
        XCTAssertFalse(kidsChannels.isEmpty)
        XCTAssertTrue(kidsChannels.allSatisfy { $0.category == "kids" || $0.type == "kids" })

        let radioChannels = repo.getChannels(byType: "radio")
        XCTAssertFalse(radioChannels.isEmpty)
        XCTAssertTrue(radioChannels.allSatisfy { ($0.isRadio == true) || $0.category == "radio" || $0.type == "radio" })
    }
}
