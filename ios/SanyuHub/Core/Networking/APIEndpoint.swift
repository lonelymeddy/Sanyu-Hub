import Foundation

public enum APIEndpoint {
    case getMovies(page: Int?, limit: Int?, search: String?, vj: String?, genre: String?, year: Int?, sort: String?)
    case getMovieDetail(id: String)
    case getSeries(page: Int?, limit: Int?, search: String?, vj: String?, genre: String?, sort: String?)
    case getSeriesDetail(id: String)
    case getConcerts(page: Int?, limit: Int?, search: String?)
    case getConcertDetail(id: String)
    case getLiveTvEpg(channelId: String)
    case getLiveTvViewers(channelId: String)

    public func url(baseURL: String) -> URL? {
        var components = URLComponents(string: baseURL)
        guard components != nil else { return nil }

        switch self {
        case .getMovies(let page, let limit, let search, let vj, let genre, let year, let sort):
            components?.path += "/api/movies"
            var queryItems: [URLQueryItem] = []
            if let page = page { queryItems.append(URLQueryItem(name: "page", value: "\(page)")) }
            if let limit = limit { queryItems.append(URLQueryItem(name: "limit", value: "\(limit)")) }
            if let search = search, !search.isEmpty { queryItems.append(URLQueryItem(name: "search", value: search)) }
            if let vj = vj, !vj.isEmpty { queryItems.append(URLQueryItem(name: "vj", value: vj)) }
            if let genre = genre, !genre.isEmpty { queryItems.append(URLQueryItem(name: "genre", value: genre)) }
            if let year = year { queryItems.append(URLQueryItem(name: "year", value: "\(year)")) }
            if let sort = sort, !sort.isEmpty { queryItems.append(URLQueryItem(name: "sort", value: sort)) }
            if !queryItems.isEmpty { components?.queryItems = queryItems }

        case .getMovieDetail(let id):
            components?.path += "/api/movies/\(id)"

        case .getSeries(let page, let limit, let search, let vj, let genre, let sort):
            components?.path += "/api/series"
            var queryItems: [URLQueryItem] = []
            if let page = page { queryItems.append(URLQueryItem(name: "page", value: "\(page)")) }
            if let limit = limit { queryItems.append(URLQueryItem(name: "limit", value: "\(limit)")) }
            if let search = search, !search.isEmpty { queryItems.append(URLQueryItem(name: "search", value: search)) }
            if let vj = vj, !vj.isEmpty { queryItems.append(URLQueryItem(name: "vj", value: vj)) }
            if let genre = genre, !genre.isEmpty { queryItems.append(URLQueryItem(name: "genre", value: genre)) }
            if let sort = sort, !sort.isEmpty { queryItems.append(URLQueryItem(name: "sort", value: sort)) }
            if !queryItems.isEmpty { components?.queryItems = queryItems }

        case .getSeriesDetail(let id):
            components?.path += "/api/series/\(id)"

        case .getConcerts(let page, let limit, let search):
            components?.path += "/api/concerts"
            var queryItems: [URLQueryItem] = []
            if let page = page { queryItems.append(URLQueryItem(name: "page", value: "\(page)")) }
            if let limit = limit { queryItems.append(URLQueryItem(name: "limit", value: "\(limit)")) }
            if let search = search, !search.isEmpty { queryItems.append(URLQueryItem(name: "search", value: search)) }
            if !queryItems.isEmpty { components?.queryItems = queryItems }

        case .getConcertDetail(let id):
            components?.path += "/api/concerts/\(id)"

        case .getLiveTvEpg(let channelId):
            components?.path += "/api/live-tv/epg/\(channelId)"

        case .getLiveTvViewers(let channelId):
            components?.path += "/api/live-tv/viewers/\(channelId)"
        }

        return components?.url
    }
}
