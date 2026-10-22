import SwiftUI

public struct Theme {
    // Colors
    public static let background = Color(hex: 0x0B0C10)
    public static let surface = Color(hex: 0x161822)
    public static let surfaceElevated = Color(hex: 0x1F2232)
    public static let accent = Color(hex: 0xE50914) // SanyuHub Red
    public static let accentHover = Color(hex: 0xB80710)
    public static let gold = Color(hex: 0xFFD700)
    public static let textPrimary = Color.white
    public static let textSecondary = Color(hex: 0xA0A5B5)
    public static let textMuted = Color(hex: 0x6C7284)
    public static let border = Color(hex: 0x2A2D3D)

    // Layout
    public static let cornerRadiusSmall: CGFloat = 6.0
    public static let cornerRadiusMedium: CGFloat = 10.0
    public static let cornerRadiusLarge: CGFloat = 16.0

    // Animations
    public static let defaultAnimation = Animation.easeInOut(duration: 0.25)
}

extension Color {
    init(hex: UInt, alpha: Double = 1.0) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xff) / 255.0,
            green: Double((hex >> 8) & 0xff) / 255.0,
            blue: Double(hex & 0xff) / 255.0,
            opacity: alpha
        )
    }
}
