import SwiftUI

public struct LibraryView: View {
    @EnvironmentObject private var env: AppEnvironment
    @StateObject private var viewModel = LibraryViewModel()

    @State private var selectedMovie: Movie?
    @State private var selectedSeries: Series?
    @State private var selectedConcert: Concert?

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                Theme.background.ignoresSafeArea()

                VStack(spacing: 0) {
                    // Category Selectors
                    HStack(spacing: 8) {
                        ForEach(LibraryViewModel.Category.allCases) { category in
                            let isSelected = category == viewModel.selectedCategory
                            Button(action: {
                                viewModel.selectCategory(category)
                            }) {
                                Text(category.rawValue)
                                    .font(.subheadline)
                                    .fontWeight(isSelected ? .bold : .semibold)
                                    .foregroundColor(isSelected ? .white : Theme.textSecondary)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                                    .background(isSelected ? Theme.accent : Theme.surface)
                                    .cornerRadius(Theme.cornerRadiusMedium)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: Theme.cornerRadiusMedium)
                                            .stroke(isSelected ? Theme.accent : Theme.border, lineWidth: 1)
                                    )
                            }
                        }
                    }
                    .padding(16)

                    // VJ Filter Selectors (Shown EXCLUSIVELY under Movies category)
                    if viewModel.selectedCategory == .movies && !viewModel.availableVJs.isEmpty {
                        FilterSelectorView(
                            items: viewModel.availableVJs,
                            selectedItem: viewModel.selectedVJ
                        ) { vj in
                            viewModel.selectVJ(vj)
                        }
                        .padding(.bottom, 12)
                    }

                    // Content Area
                    if viewModel.isLoading {
                        ScrollView {
                            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                                ForEach(0..<8, id: \.self) { _ in
                                    PosterCardSkeleton()
                                }
                            }
                            .padding(16)
                        }
                    } else if let error = viewModel.errorMessage {
                        VStack(spacing: 16) {
                            Text(error)
                                .foregroundColor(Theme.textSecondary)
                            Button("Retry") {
                                Task { await viewModel.loadCurrentCategory() }
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(Theme.accent)
                        }
                        .frame(maxHeight: .infinity)
                    } else {
                        ScrollView {
                            switch viewModel.selectedCategory {
                            case .movies, .music:
                                if viewModel.movies.isEmpty {
                                    emptyStateView
                                } else {
                                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                                        ForEach(viewModel.movies) { movie in
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
                                    .padding(16)
                                }

                            case .series:
                                if viewModel.seriesList.isEmpty {
                                    emptyStateView
                                } else {
                                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                                        ForEach(viewModel.seriesList) { series in
                                            PosterCardView(
                                                title: series.title,
                                                posterUrl: series.poster,
                                                vj: series.vj,
                                                rating: series.rating
                                            ) {
                                                selectedSeries = series
                                            }
                                        }
                                    }
                                    .padding(16)
                                }

                            case .concerts:
                                if viewModel.concertsList.isEmpty {
                                    emptyStateView
                                } else {
                                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                                        ForEach(viewModel.concertsList) { concert in
                                            PosterCardView(
                                                title: concert.title,
                                                posterUrl: concert.thumbUrl,
                                                vj: concert.venue
                                            ) {
                                                selectedConcert = concert
                                            }
                                        }
                                    }
                                    .padding(16)
                                }
                            }
                        }
                        .refreshable {
                            await viewModel.loadCurrentCategory()
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
        .task {
            if viewModel.movies.isEmpty && viewModel.seriesList.isEmpty {
                await viewModel.loadCurrentCategory()
            }
        }
    }

    private var emptyStateView: some View {
        VStack(spacing: 12) {
            Image(systemName: "film.stack")
                .font(.system(size: 48))
                .foregroundColor(Theme.textMuted)

            Text("No content found")
                .font(.headline)
                .foregroundColor(Theme.textPrimary)

            Text("Try adjusting your VJ filter or category selection.")
                .font(.subheadline)
                .foregroundColor(Theme.textSecondary)
                .multilineTextAlignment(.center)
        }
        .padding(32)
        .frame(maxHeight: .infinity)
    }
}
