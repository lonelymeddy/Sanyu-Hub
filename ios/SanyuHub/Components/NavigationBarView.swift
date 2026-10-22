import SwiftUI

public struct NavigationBarView: View {
    public let title: String
    public let onSearchTap: () -> Void

    public init(title: String = "SanyuHub", onSearchTap: @escaping () -> Void) {
        self.title = title
        self.onSearchTap = onSearchTap
    }

    public var body: some View {
        HStack {
            HStack(spacing: 8) {
                Image(uiImage: UIImage(named: "icon_1024") ?? UIImage())
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 32, height: 32)
                    .cornerRadius(6)

                Text(title)
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(Theme.textPrimary)
            }

            Spacer()

            Button(action: onSearchTap) {
                HStack(spacing: 6) {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 14, weight: .bold))
                    Text("Search...")
                        .font(.subheadline)
                }
                .foregroundColor(Theme.textSecondary)
                .padding(.horizontal, 12)
                .padding(.vertical, 7)
                .background(Theme.surfaceElevated)
                .cornerRadius(20)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Theme.border, lineWidth: 1)
                )
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(Theme.background.ignoresSafeArea(edges: .top))
    }
}
