import SwiftUI

public struct SeriesDetailView: View {
    public let seriesId: String

    @EnvironmentObject private var env: AppEnvironment
    @StateObject private var viewModel = DetailViewModel()

    public init(seriesId: String) {
        self.seriesId = seriesId
    }

    public var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()

            if viewModel.isLoading {
                VStack {
                    ProgressView("Loading series...")
                        .tint(Theme.accent)
                        .foregroundColor(Theme.textSecondary)
                }
            } else if let series = viewModel.series {
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        // Backdrop Header
                        ZStack(alignment: .bottomLeading) {
                            DynamicAsyncImage(urlString: series.backdrop ?? series.poster, contentMode: .fill)
                                .frame(height: 240)
                                .frame(maxWidth: .infinity)
                                .clipped()

                            LinearGradient(
                                gradient: Gradient(colors: [Color.clear, Theme.background]),
                                startPoint: .top,
                                endPoint: .bottom
                            )

                            VStack(alignment: .leading, spacing: 8) {
                                if let vj = series.vj, !vj.isEmpty {
                                    BadgeView(type: .vj(name: vj))
                                }

                                Text(series.title)
                                    .font(.title2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                            }
                            .padding(16)
                        }

                        // Overview Details
                        VStack(alignment: .leading, spacing: 12) {
                            if let overview = series.overview, !overview.isEmpty {
                                Text(overview)
                                    .font(.body)
                                    .foregroundColor(Theme.textSecondary)
                            }
                        }
                        .padding(.horizontal, 16)

                        // Episodes List
                        if let episodes = series.episodes, !episodes.isEmpty {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("EPISODES")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(Theme.textMuted)

                                ForEach(episodes) { ep in
                                    Button(action: {
                                        env.activePlayerMedia = .episode(series: series, episode: ep)
                                    }) {
                                        HStack {
                                            VStack(alignment: .leading, spacing: 4) {
                                                Text("Episode \(ep.episodeNumber): \(ep.title)")
                                                    .font(.subheadline)
                                                    .fontWeight(.semibold)
                                                    .foregroundColor(Theme.textPrimary)
                                            }

                                            Spacer()

                                            Image(systemName: "play.circle.fill")
                                                .font(.title3)
                                                .foregroundColor(Theme.accent)
                                        }
                                        .padding(14)
                                        .background(Theme.surface)
                                        .cornerRadius(Theme.cornerRadiusMedium)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: Theme.cornerRadiusMedium)
                                                .stroke(Theme.border, lineWidth: 1)
                                        )
                                    }
                                    .buttonStyle(PlainButtonStyle())
                                }
                            }
                            .padding(.horizontal, 16)
                        }
                    }
                }
            } else if let error = viewModel.errorMessage {
                VStack(spacing: 12) {
                    Text(error)
                        .foregroundColor(Theme.textSecondary)
                    Button("Retry") {
                        Task { await viewModel.loadSeriesDetail(id: seriesId) }
                    }
                    .tint(Theme.accent)
                }
            }
        }
        .task {
            await viewModel.loadSeriesDetail(id: seriesId)
        }
    }
}
