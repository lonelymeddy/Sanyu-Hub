import SwiftUI

public struct MovieDetailView: View {
    public let movieId: String

    @EnvironmentObject private var env: AppEnvironment
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @StateObject private var viewModel = DetailViewModel()

    public init(movieId: String) {
        self.movieId = movieId
    }

    public var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()

            if viewModel.isLoading {
                VStack {
                    ProgressView("Loading movie...")
                        .tint(Theme.accent)
                        .foregroundColor(Theme.textSecondary)
                }
            } else if let movie = viewModel.movie {
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        if horizontalSizeClass == .regular {
                            // iPad 2-Column Side-by-Side Hero Layout
                            HStack(alignment: .top, spacing: 24) {
                                DynamicAsyncImage(urlString: movie.poster, contentMode: .fill)
                                    .frame(width: 240, height: 360)
                                    .cornerRadius(12)
                                    .clipped()

                                VStack(alignment: .leading, spacing: 16) {
                                    if let vj = movie.vj, !vj.isEmpty {
                                        BadgeView(type: .vj(name: vj))
                                    }

                                    Text(movie.title)
                                        .font(.largeTitle)
                                        .fontWeight(.bold)
                                        .foregroundColor(.white)

                                    HStack(spacing: 12) {
                                        if let rating = movie.rating, rating > 0 {
                                            BadgeView(type: .rating(value: rating))
                                        }

                                        if let year = movie.year, year > 0 {
                                            Text("\(year)")
                                                .font(.subheadline)
                                                .foregroundColor(Theme.textSecondary)
                                        }

                                        if let genres = movie.genres, !genres.isEmpty {
                                            Text(genres.joined(separator: " • "))
                                                .font(.caption)
                                                .foregroundColor(Theme.textMuted)
                                        }
                                    }

                                    if let overview = movie.overview, !overview.isEmpty {
                                        Text(overview)
                                            .font(.body)
                                            .foregroundColor(Theme.textSecondary)
                                            .fixedSize(horizontal: false, vertical: true)
                                    }

                                    Button(action: {
                                        env.activePlayerMedia = .movie(movie: movie)
                                    }) {
                                        HStack(spacing: 8) {
                                            Image(systemName: "play.fill")
                                            Text("Watch Movie")
                                                .fontWeight(.bold)
                                        }
                                        .foregroundColor(.white)
                                        .padding(.horizontal, 28)
                                        .padding(.vertical, 14)
                                        .background(Theme.accent)
                                        .cornerRadius(Theme.cornerRadiusMedium)
                                    }
                                    .padding(.top, 8)
                                }
                            }
                            .padding(24)
                        } else {
                            // Compact iPhone Layout
                            ZStack(alignment: .bottomLeading) {
                                DynamicAsyncImage(urlString: movie.backdrop ?? movie.poster, contentMode: .fill)
                                    .frame(height: 240)
                                    .frame(maxWidth: .infinity)
                                    .clipped()

                                LinearGradient(
                                    gradient: Gradient(colors: [Color.clear, Theme.background]),
                                    startPoint: .top,
                                    endPoint: .bottom
                                )

                                VStack(alignment: .leading, spacing: 8) {
                                    if let vj = movie.vj, !vj.isEmpty {
                                        BadgeView(type: .vj(name: vj))
                                    }

                                    Text(movie.title)
                                        .font(.title2)
                                        .fontWeight(.bold)
                                        .foregroundColor(.white)
                                }
                                .padding(16)
                            }

                            // Play Button
                            Button(action: {
                                env.activePlayerMedia = .movie(movie: movie)
                            }) {
                                HStack(spacing: 8) {
                                    Image(systemName: "play.fill")
                                    Text("Watch Movie")
                                        .fontWeight(.bold)
                                }
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(Theme.accent)
                                .cornerRadius(Theme.cornerRadiusMedium)
                            }
                            .padding(.horizontal, 16)

                            // Metadata Details
                            VStack(alignment: .leading, spacing: 12) {
                                HStack(spacing: 12) {
                                    if let rating = movie.rating, rating > 0 {
                                        BadgeView(type: .rating(value: rating))
                                    }

                                    if let year = movie.year, year > 0 {
                                        Text("\(year)")
                                            .font(.subheadline)
                                            .foregroundColor(Theme.textSecondary)
                                    }

                                    if let genres = movie.genres, !genres.isEmpty {
                                        Text(genres.joined(separator: " • "))
                                            .font(.caption)
                                            .foregroundColor(Theme.textMuted)
                                            .lineLimit(1)
                                    }
                                }

                                if let overview = movie.overview, !overview.isEmpty {
                                    Text("Overview")
                                        .font(.headline)
                                        .foregroundColor(Theme.textPrimary)

                                    Text(overview)
                                        .font(.body)
                                        .foregroundColor(Theme.textSecondary)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                            }
                            .padding(.horizontal, 16)
                        }

                        // Related Movies
                        if !viewModel.relatedMovies.isEmpty {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("MORE FROM THIS VJ")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(Theme.textMuted)

                                ScrollView(.horizontal, showsIndicators: false) {
                                    HStack(spacing: 12) {
                                        ForEach(viewModel.relatedMovies) { relMovie in
                                            PosterCardView(
                                                title: relMovie.title,
                                                posterUrl: relMovie.poster,
                                                vj: relMovie.vj,
                                                rating: relMovie.rating
                                            ) {
                                                Task {
                                                    await viewModel.loadMovieDetail(id: relMovie.id)
                                                }
                                            }
                                            .frame(width: 140)
                                        }
                                    }
                                }
                            }
                            .padding(.horizontal, 16)
                            .padding(.top, 12)
                        }
                    }
                }
            } else if let error = viewModel.errorMessage {
                VStack(spacing: 12) {
                    Text(error)
                        .foregroundColor(Theme.textSecondary)
                    Button("Retry") {
                        Task { await viewModel.loadMovieDetail(id: movieId) }
                    }
                    .tint(Theme.accent)
                }
            }
        }
        .task {
            await viewModel.loadMovieDetail(id: movieId)
        }
    }
}
