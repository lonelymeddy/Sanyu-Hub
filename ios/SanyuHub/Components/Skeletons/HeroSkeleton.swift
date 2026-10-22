import SwiftUI

public struct HeroSkeleton: View {
    public init() {}

    public var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            SkeletonView()
                .frame(maxWidth: .infinity)
                .aspectRatio(16.0 / 9.0, contentMode: .fit)
                .cornerRadius(Theme.cornerRadiusLarge)

            HStack(spacing: 12) {
                SkeletonView()
                    .frame(width: 120, height: 40)
                    .cornerRadius(Theme.cornerRadiusMedium)

                SkeletonView()
                    .frame(width: 100, height: 40)
                    .cornerRadius(Theme.cornerRadiusMedium)
            }
        }
    }
}
