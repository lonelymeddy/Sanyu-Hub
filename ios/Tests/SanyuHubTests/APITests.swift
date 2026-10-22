import XCTest
@testable import SanyuHub

final class APITests: XCTestCase {
    func testMoviesEndpointURLBuilding() {
        let endpoint = APIEndpoint.getMovies(page: 2, limit: 24, search: "action", vj: "junior", genre: nil, year: 2023, sort: "rating")
        let url = endpoint.url(baseURL: "https://sanyuhub.com")

        XCTAssertNotNil(url)
        let urlString = url?.absoluteString ?? ""

        XCTAssertTrue(urlString.contains("/api/movies"))
        XCTAssertTrue(urlString.contains("page=2"))
        XCTAssertTrue(urlString.contains("limit=24"))
        XCTAssertTrue(urlString.contains("search=action"))
        XCTAssertTrue(urlString.contains("vj=junior"))
        XCTAssertTrue(urlString.contains("year=2023"))
        XCTAssertTrue(urlString.contains("sort=rating"))
    }

    func testLiveTvEndpointsURLBuilding() {
        let epgEndpoint = APIEndpoint.getLiveTvEpg(channelId: "ntv-uganda")
        let epgUrl = epgEndpoint.url(baseURL: "https://sanyuhub.com")
        XCTAssertEqual(epgUrl?.absoluteString, "https://sanyuhub.com/api/live-tv/epg/ntv-uganda")

        let viewersEndpoint = APIEndpoint.getLiveTvViewers(channelId: "spark-tv")
        let viewersUrl = viewersEndpoint.url(baseURL: "https://sanyuhub.com")
        XCTAssertEqual(viewersUrl?.absoluteString, "https://sanyuhub.com/api/live-tv/viewers/spark-tv")
    }
}
