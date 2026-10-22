import SwiftUI

public struct LiveTVView: View {
    @EnvironmentObject private var env: AppEnvironment
    @StateObject private var viewModel = LiveTVViewModel()

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                Theme.background.ignoresSafeArea()

                VStack(spacing: 0) {
                    // Category Selector Bar
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(LiveTVViewModel.ChannelType.allCases) { type in
                                let isSelected = type == viewModel.selectedType
                                Button(action: {
                                    viewModel.selectType(type)
                                }) {
                                    Text(type.rawValue)
                                        .font(.subheadline)
                                        .fontWeight(isSelected ? .bold : .medium)
                                        .foregroundColor(isSelected ? .white : Theme.textSecondary)
                                        .padding(.horizontal, 16)
                                        .padding(.vertical, 8)
                                        .background(isSelected ? Theme.accent : Theme.surface)
                                        .cornerRadius(20)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 20)
                                                .stroke(isSelected ? Theme.accent : Theme.border, lineWidth: 1)
                                        )
                                }
                            }
                        }
                        .padding(16)
                    }

                    // Content Area
                    if viewModel.channels.isEmpty {
                        emptyChannelsView
                    } else {
                        ScrollView {
                            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                                ForEach(viewModel.channels) { channel in
                                    ChannelCardView(channel: channel) {
                                        env.activePlayerMedia = .liveChannel(channel: channel)
                                    }
                                }
                            }
                            .padding(16)
                        }
                    }
                }
            }
        }
    }

    private var emptyChannelsView: some View {
        VStack(spacing: 12) {
            Image(systemName: "tv.slash")
                .font(.system(size: 48))
                .foregroundColor(Theme.textMuted)

            Text("No channels available")
                .font(.headline)
                .foregroundColor(Theme.textPrimary)

            Text("There are currently no \(viewModel.selectedType.rawValue.lowercased()) broadcasts listed.")
                .font(.subheadline)
                .foregroundColor(Theme.textSecondary)
                .multilineTextAlignment(.center)
        }
        .padding(32)
        .frame(maxHeight: .infinity)
    }
}
