import SwiftUI

public struct ConcertDetailView: View {
    public let concertId: String

    @StateObject private var viewModel = DetailViewModel()

    public init(concertId: String) {
        self.concertId = concertId
    }

    public var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()

            if viewModel.isLoading {
                VStack {
                    ProgressView("Loading concert...")
                        .tint(Theme.accent)
                        .foregroundColor(Theme.textSecondary)
                }
            } else if let concert = viewModel.concert {
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        DynamicAsyncImage(urlString: concert.thumbUrl, contentMode: .fill)
                            .frame(height: 240)
                            .frame(maxWidth: .infinity)
                            .clipped()

                        VStack(alignment: .leading, spacing: 12) {
                            BadgeView(type: .custom(text: "LIVE CONCERT", color: Theme.accent))

                            Text(concert.title)
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(.white)

                            if let venue = concert.venue, !venue.isEmpty {
                                HStack(spacing: 6) {
                                    Image(systemName: "mappin.and.ellipse")
                                        .foregroundColor(Theme.accent)
                                    Text(venue)
                                        .font(.subheadline)
                                        .foregroundColor(Theme.textPrimary)
                                }
                            }

                            if let date = concert.date, !date.isEmpty {
                                HStack(spacing: 6) {
                                    Image(systemName: "calendar")
                                        .foregroundColor(Theme.gold)
                                    Text(date + (concert.time != nil ? " at \(concert.time!)" : ""))
                                        .font(.subheadline)
                                        .foregroundColor(Theme.textSecondary)
                                }
                            }

                            if let description = concert.description, !description.isEmpty {
                                Divider()
                                    .background(Theme.border)

                                Text("About Event")
                                    .font(.headline)
                                    .foregroundColor(Theme.textPrimary)

                                Text(description)
                                    .font(.body)
                                    .foregroundColor(Theme.textSecondary)
                            }
                        }
                        .padding(16)
                    }
                }
            } else if let error = viewModel.errorMessage {
                VStack(spacing: 12) {
                    Text(error)
                        .foregroundColor(Theme.textSecondary)
                    Button("Retry") {
                        Task { await viewModel.loadConcertDetail(id: concertId) }
                    }
                    .tint(Theme.accent)
                }
            }
        }
        .task {
            await viewModel.loadConcertDetail(id: concertId)
        }
    }
}
