import Foundation

public protocol NetworkServiceProtocol {
    func fetch<T: Decodable>(_ endpoint: APIEndpoint) async throws -> T
}

public class NetworkService: NetworkServiceProtocol {
    private let baseURL: String
    private let session: URLSession

    public init(baseURL: String = "https://sanyuhub.com", session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    public func fetch<T: Decodable>(_ endpoint: APIEndpoint) async throws -> T {
        guard let url = endpoint.url(baseURL: baseURL) else {
            throw NetworkError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.timeoutInterval = 15.0
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.unknown(message: "Non-HTTP response received.")
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw NetworkError.requestFailed(statusCode: httpResponse.statusCode)
        }

        guard !data.isEmpty else {
            throw NetworkError.noData
        }

        do {
            let decoder = JSONDecoder()
            return try decoder.decode(T.self, from: data)
        } catch {
            throw NetworkError.decodingError(message: error.localizedDescription)
        }
    }
}
