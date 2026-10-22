import SwiftUI

public struct PosterCardSkeleton: View {
    public init() {}

    public var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            SkeletonView()
                .frame(maxWidth: .infinity)
                .aspectRatio(2.0 / 3.0, contentMode: .fit)
                .cornerRadius(Theme.cornerRadiusMedium)

            SkeletonView()
                .frame(height: 14)
                .frame(width: 100)
                .cornerRadius(4)

            SkeletonView()
                .frame(height: 10)
                .frame(width: 60)
                .cornerRadius(4)
        }
    }
}
