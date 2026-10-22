import Foundation

public enum NetworkError: LocalizedError, Equatable {
    case invalidURL
    case requestFailed(statusCode: Int)
    case decodingError(message: String)
    case noData
    case unknown(message: String)

    public var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL address."
        case .requestFailed(let statusCode):
            return "Server error with status code \(statusCode)."
        case .decodingError(let message):
            return "Failed to parse data: \(message)"
        case .noData:
            return "No data returned from server."
        case .unknown(let message):
            return message
        }
    }
}
