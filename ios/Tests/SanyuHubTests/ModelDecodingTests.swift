import XCTest
@testable import SanyuHub

final class ModelDecodingTests: XCTestCase {
    func testMovieJSONDecoding() throws {
        let json = """
        {
            "id": "movie-123",
            "title": "Fast and Furious Translated",
            "vj": "junior",
            "overview": "Action thriller translated in Luganda by VJ Junior",
            "poster": "https://sanyuhub.com/images/fast.jpg",
            "backdrop": "https://sanyuhub.com/images/fast_bg.jpg",
            "stream_url": "https://sanyuhub.com/streams/fast.mp4",
            "rating": 8.5,
            "year": 2023,
            "genres": ["Action", "Thriller"]
        }
        """.data(using: .utf8)!

        let decoder = JSONDecoder()
        let movie = try decoder.decode(Movie.self, from: json)

        XCTAssertEqual(movie.id, "movie-123")
        XCTAssertEqual(movie.title, "Fast and Furious Translated")
        XCTAssertEqual(movie.vj, "junior")
        XCTAssertEqual(movie.streamUrl, "https://sanyuhub.com/streams/fast.mp4")
        XCTAssertEqual(movie.rating, 8.5)
        XCTAssertEqual(movie.year, 2023)
        XCTAssertEqual(movie.genres, ["Action", "Thriller"])
    }

    func testPaginatedMovieResponseDecoding() throws {
        let json = """
        {
            "movies": [
                {
                    "id": "m1",
                    "title": "Movie One",
                    "vj": "ice p"
                }
            ],
            "page": 1,
            "limit": 24,
            "total": 1,
            "totalPages": 1,
            "vjs": ["ice p", "junior"],
            "genres": ["Action"]
        }
        """.data(using: .utf8)!

        let decoder = JSONDecoder()
        let response = try decoder.decode(PaginatedMovieResponse.self, from: json)

        XCTAssertEqual(response.page, 1)
        XCTAssertEqual(response.movies.count, 1)
        XCTAssertEqual(response.movies.first?.title, "Movie One")
        XCTAssertEqual(response.vjs, ["ice p", "junior"])
    }
}
