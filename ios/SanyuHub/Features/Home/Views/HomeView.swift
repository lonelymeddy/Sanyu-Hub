import SwiftUI

public struct HomeView: View {
    @EnvironmentObject private var env: AppEnvironment
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @StateObject private var viewModel = HomeViewModel()

    @State private var selectedMovie: Movie?
    @State private var selectedConcert: Concert?

    private var gridColumns: [GridItem] {
        if horizontalSizeClass == .regular {
            return [GridItem(.adaptive(minimum: 180, maximum: 240), spacing: 16)]
        } else {
            return [GridItem(.flexible()), GridItem(.flexible())]
        }
    }

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                Theme.background.ignoresSafeArea()

                if viewModel.isLoading {
                    ScrollView {
                        VStack(spacing: 24) {
                            HeroSkeleton()
                            VStack(spacing: 16) {
                                ForEach(0..<3, id: \.self) { _ in
                                    HStack(spacing: 12) {
                                        PosterCardSkeleton()
                                        PosterCardSkeleton()
                                    }
                                }
                            }
                        }
                        .padding(16)
                    }
                } else if let error = viewModel.errorMessage {
                    VStack(spacing: 16) {
                        Image(systemName: "wifi.exclamationmark")
                            .font(.system(size: 48))
                            .foregroundColor(Theme.accent)

                        Text("Connection Failure")
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(Theme.textPrimary)

                        Text(error)
                            .font(.subheadline)
                            .foregroundColor(Theme.textSecondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 32)

                        Button(action: {
                            Task {
                                await viewModel.loadData()
                            }
                        }) {
                            Text("Retry")
                                .font(.headline)
                                .foregroundColor(.white)
                                .padding(.horizontal, 24)
                                .padding(.vertical, 12)
                                .background(Theme.accent)
                                .cornerRadius(8)
                        }
                    }
                } else {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 28) {
                            // Hero Carousel
                            HeroCarouselView(items: viewModel.heroItems) { item in
                                switch item.actionType {
                                case .openCategory(let cat):
                                    if cat == "live-tv" {
                                        env.selectedTab = .liveTv
                                    } else {
                                        env.selectedTab = .library
                                    }
                                default:
                                    env.selectedTab = .library
                                }
                            }

                            // 1. Live TV Section (Up to 2 items)
                            VStack(alignment: .leading, spacing: 12) {
                                SectionRowHeader(title: "Live TV Channels", iconName: "tv.fill") {
                                    env.selectedTab = .liveTv
                                }

                                LazyVGrid(columns: gridColumns, spacing: 12) {
                                    ForEach(viewModel.liveTvSection) { channel in
                                        ChannelCardView(channel: channel) {
                                            env.activePlayerMedia = .liveChannel(channel: channel)
                                        }
                                    }
                                }
                            }

                            // 2. Trending Movies Section (Up to 2 items)
                            VStack(alignment: .leading, spacing: 12) {
                                SectionRowHeader(title: "Trending Movies", iconName: "flame.fill") {
                                    env.selectedTab = .library
                                }

                                LazyVGrid(columns: gridColumns, spacing: 12) {
                                    ForEach(viewModel.trendingMoviesSection) { movie in
                                        PosterCardView(
                                            title: movie.title,
                                            posterUrl: movie.poster,
                                            vj: movie.vj,
                                            rating: movie.rating,
                                            year: movie.year
                                        ) {
                                            selectedMovie = movie
                                        }
                                    }
                                }
                            }

                            // 3. Hot Music Section (Up to 2 items)
                            VStack(alignment: .leading, spacing: 12) {
                                SectionRowHeader(title: "Hot Music", iconName: "music.note.list") {
                                    env.selectedTab = .library
                                }

                                LazyVGrid(columns: gridColumns, spacing: 12) {
                                    ForEach(viewModel.hotMusicSection) { movie in
                                        PosterCardView(
                                            title: movie.title,
                                            posterUrl: movie.poster,
                                            vj: movie.vj,
                                            rating: movie.rating,
                                            year: movie.year
                                        ) {
                                            selectedMovie = movie
                                        }
                                    }
                                }
                            }

                            // 4. Concerts Section (Up to 2 items)
                            VStack(alignment: .leading, spacing: 12) {
                                SectionRowHeader(title: "Concerts & Events", iconName: "guitars.fill") {
                                    env.selectedTab = .library
                                }

                                LazyVGrid(columns: gridColumns, spacing: 12) {
                                    ForEach(viewModel.concertsSection) { concert in
                                        PosterCardView(
                                            title: concert.title,
                                            posterUrl: concert.thumbUrl,
                                            vj: concert.venue
                                        ) {
                                            selectedConcert = concert
                                        }
                                    }
                                }
                            }

                            // 5. Doppest Radio Stations (Up to 2 items)
                            VStack(alignment: .leading, spacing: 12) {
                                SectionRowHeader(title: "Doppest Radio Stations", iconName: "radio.fill") {
                                    env.selectedTab = .liveTv
                                }

                                LazyVGrid(columns: gridColumns, spacing: 12) {
                                    ForEach(viewModel.radioSection) { radio in
                                        ChannelCardView(channel: radio) {
                                            env.activePlayerMedia = .liveChannel(channel: radio)
                                        }
                                    }
                                }
                            }
                        }
                        .padding(16)
                    }
                    .refreshable {
                        await viewModel.loadData()
                    }
                }
            }
            .navigationDestination(item: $selectedMovie) { movie in
                MovieDetailView(movieId: movie.id)
            }
            .navigationDestination(item: $selectedConcert) { concert in
                ConcertDetailView(concertId: concert.id)
            }
        }
        .task {
            if viewModel.trendingMoviesSection.isEmpty {
                await viewModel.loadData()
            }
        }
    }
}
