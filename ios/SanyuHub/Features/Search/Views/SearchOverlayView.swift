import SwiftUI

public struct SearchOverlayView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var env: AppEnvironment
    @StateObject private var viewModel = SearchViewModel()

    @State private var selectedMovie: Movie?
    @State private var selectedSeries: Series?
    @State private var selectedConcert: Concert?

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                Theme.background.ignoresSafeArea()

                VStack(spacing: 0) {
                    // Search Header Bar
                    HStack(spacing: 12) {
                        HStack(spacing: 8) {
                            Image(systemName: "magnifyingglass")
                                .foregroundColor(Theme.textSecondary)

                            TextField("Search movies, series, live TV, radio...", text: $viewModel.query)
                                .foregroundColor(Theme.textPrimary)
                                .textInputAutocapitalization(.never)
                                .disableAutocorrection(true)

                            if !viewModel.query.isEmpty {
                                Button(action: { viewModel.query = "" }) {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundColor(Theme.textMuted)
                                }
                            }
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 10)
                        .background(Theme.surface)
                        .cornerRadius(20)
                        .overlay(
                            RoundedRectangle(cornerRadius: 20)
                                .stroke(Theme.border, lineWidth: 1)
                        )

                        Button("Cancel") {
                            dismiss()
                        }
                        .foregroundColor(Theme.accent)
                        .fontWeight(.semibold)
                    }
                    .padding(16)

                    // Results
                    if viewModel.isSearching {
                        VStack {
                            Spacer()
                            ProgressView("Searching SanyuHub...")
                                .tint(Theme.accent)
                                .foregroundColor(Theme.textSecondary)
                            Spacer()
                        }
                    } else if viewModel.query.isEmpty {
                        VStack(spacing: 12) {
                            Spacer()
                            Image(systemName: "magnifyingglass")
                                .font(.system(size: 48))
                                .foregroundColor(Theme.textMuted)
                            Text("Type to search SanyuHub")
                                .font(.headline)
                                .foregroundColor(Theme.textPrimary)
                            Text("Find movies, Luganda translated series, live channels, and concerts.")
                                .font(.subheadline)
                                .foregroundColor(Theme.textSecondary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 32)
                            Spacer()
                        }
                    } else if viewModel.channelResults.isEmpty && viewModel.movieResults.isEmpty && viewModel.seriesResults.isEmpty && viewModel.concertResults.isEmpty {
                        VStack(spacing: 12) {
                            Spacer()
                            Image(systemName: "doc.text.magnifyingglass")
                                .font(.system(size: 48))
                                .foregroundColor(Theme.textMuted)
                            Text("No results for \"\(viewModel.query)\"")
                                .font(.headline)
                                .foregroundColor(Theme.textPrimary)
                            Text("Check spelling or search for VJ names like Junior, Ice P, or Mark.")
                                .font(.subheadline)
                                .foregroundColor(Theme.textSecondary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 32)
                            Spacer()
                        }
                    } else {
                        ScrollView {
                            VStack(alignment: .leading, spacing: 20) {
                                // Channels
                                if !viewModel.channelResults.isEmpty {
                                    VStack(alignment: .leading, spacing: 8) {
                                        Text("LIVE TV & RADIO")
                                            .font(.caption)
                                            .fontWeight(.bold)
                                            .foregroundColor(Theme.textMuted)

                                        ForEach(viewModel.channelResults) { channel in
                                            SearchResultCardView(
                                                title: channel.name,
                                                subtitle: channel.categoryLabel,
                                                imageUrl: channel.logo,
                                                badgeText: channel.isRadio == true ? "RADIO" : "LIVE TV"
                                            ) {
                                                dismiss()
                                                env.activePlayerMedia = .liveChannel(channel: channel)
                                            }
                                        }
                                    }
                                }

                                // Movies
                                if !viewModel.movieResults.isEmpty {
                                    VStack(alignment: .leading, spacing: 8) {
                                        Text("MOVIES")
                                            .font(.caption)
                                            .fontWeight(.bold)
                                            .foregroundColor(Theme.textMuted)

                                        ForEach(viewModel.movieResults) { movie in
                                            SearchResultCardView(
                                                title: movie.title,
                                                subtitle: movie.vj != nil ? "VJ \(movie.vj!)" : movie.overview,
                                                imageUrl: movie.poster,
                                                badgeText: "MOVIE"
                                            ) {
                                                selectedMovie = movie
                                            }
                                        }
                                    }
                                }

                                // Series
                                if !viewModel.seriesResults.isEmpty {
                                    VStack(alignment: .leading, spacing: 8) {
                                        Text("SERIES")
                                            .font(.caption)
                                            .fontWeight(.bold)
                                            .foregroundColor(Theme.textMuted)

                                        ForEach(viewModel.seriesResults) { series in
                                            SearchResultCardView(
                                                title: series.title,
                                                subtitle: series.vj != nil ? "VJ \(series.vj!)" : nil,
                                                imageUrl: series.poster,
                                                badgeText: "SERIES"
                                            ) {
                                                selectedSeries = series
                                            }
                                        }
                                    }
                                }

                                // Concerts
                                if !viewModel.concertResults.isEmpty {
                                    VStack(alignment: .leading, spacing: 8) {
                                        Text("CONCERTS & EVENTS")
                                            .font(.caption)
                                            .fontWeight(.bold)
                                            .foregroundColor(Theme.textMuted)

                                        ForEach(viewModel.concertResults) { concert in
                                            SearchResultCardView(
                                                title: concert.title,
                                                subtitle: concert.venue,
                                                imageUrl: concert.thumbUrl,
                                                badgeText: "EVENT"
                                            ) {
                                                selectedConcert = concert
                                            }
                                        }
                                    }
                                }
                            }
                            .padding(16)
                        }
                    }
                }
            }
            .navigationDestination(item: $selectedMovie) { movie in
                MovieDetailView(movieId: movie.id)
            }
            .navigationDestination(item: $selectedSeries) { series in
                SeriesDetailView(seriesId: series.id)
            }
            .navigationDestination(item: $selectedConcert) { concert in
                ConcertDetailView(concertId: concert.id)
            }
        }
    }
}
