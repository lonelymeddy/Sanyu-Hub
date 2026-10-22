import SwiftUI

@main
struct SanyuHubApp: App {
    @StateObject private var env = AppEnvironment()

    init() {
        // Apply global UI appearance
        let appearance = UITabBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor(Color(hex: 0x0B0C10))
        appearance.shadowColor = UIColor(Color(hex: 0x2A2D3D))

        UITabBar.appearance().standardAppearance = appearance
        UITabBar.appearance().scrollEdgeAppearance = appearance
    }

    var body: some Scene {
        WindowGroup {
            MainTabView()
                .environmentObject(env)
                .preferredColorScheme(.dark)
                .fullScreenCover(item: $env.activePlayerMedia) { media in
                    NativePlayerView(media: media)
                        .environmentObject(env)
                }
                .sheet(isPresented: $env.isSearchPresented) {
                    SearchOverlayView()
                        .environmentObject(env)
                }
        }
    }
}

struct MainTabView: View {
    @EnvironmentObject private var env: AppEnvironment

    var body: some View {
        VStack(spacing: 0) {
            NavigationBarView {
                env.isSearchPresented = true
            }

            TabView(selection: $env.selectedTab) {
                HomeView()
                    .tabItem {
                        Label("Home", systemImage: "house.fill")
                    }
                    .tag(AppEnvironment.Tab.home)

                LibraryView()
                    .tabItem {
                        Label("Library", systemImage: "rectangle.stack.fill")
                    }
                    .tag(AppEnvironment.Tab.library)

                LiveTVView()
                    .tabItem {
                        Label("Live TV", systemImage: "tv.fill")
                    }
                    .tag(AppEnvironment.Tab.liveTv)

                MoreView()
                    .tabItem {
                        Label("More", systemImage: "ellipsis.circle.fill")
                    }
                    .tag(AppEnvironment.Tab.more)
            }
            .tint(Theme.accent)
        }
        .background(Theme.background.ignoresSafeArea())
    }
}

struct MoreView: View {
    @EnvironmentObject private var env: AppEnvironment

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.background.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        HStack(spacing: 16) {
                            Image(uiImage: UIImage(named: "icon_1024") ?? UIImage())
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(width: 60, height: 60)
                                .cornerRadius(12)

                            VStack(alignment: .leading, spacing: 4) {
                                Text("SanyuHub iOS")
                                    .font(.title3)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                                Text("Version 1.0.0 (Native SwiftUI)")
                                    .font(.caption)
                                    .foregroundColor(Theme.textSecondary)
                            }
                        }
                        .padding(16)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Theme.surface)
                        .cornerRadius(Theme.cornerRadiusMedium)

                        VStack(spacing: 1) {
                            moreOptionRow(icon: "info.circle.fill", title: "About SanyuHub", subtitle: "Streaming Luganda Translated Content")
                            moreOptionRow(icon: "shield.fill", title: "Privacy Policy", subtitle: "User data & streaming terms")
                            moreOptionRow(icon: "questionmark.circle.fill", title: "Help & Support", subtitle: "FAQs & channel requests")
                        }
                        .background(Theme.surface)
                        .cornerRadius(Theme.cornerRadiusMedium)
                    }
                    .padding(16)
                }
            }
            .navigationTitle("More")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private func moreOptionRow(icon: String, title: String, subtitle: String) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(Theme.accent)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(Theme.textPrimary)
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(Theme.textMuted)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(Theme.textMuted)
        }
        .padding(14)
        .background(Theme.surface)
    }
}
