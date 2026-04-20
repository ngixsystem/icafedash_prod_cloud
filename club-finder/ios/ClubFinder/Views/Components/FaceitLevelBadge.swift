import SwiftUI

struct FaceitLevelBadge: View {
    let level: Int
    let elo: Int

    private var levelColor: Color {
        switch level {
        case 1...4: return Color(hex: "#808080")
        case 5...7: return Color(hex: "#FFC500")
        case 8...9: return Color(hex: "#FF6500")
        case 10: return Color(hex: "#FF0000")
        default: return Color(hex: "#808080")
        }
    }

    var body: some View {
        HStack(spacing: 4) {
            Text("Lv.\(level)")
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(levelColor)
            Text("\(elo)")
                .font(.system(size: 10))
                .foregroundColor(.gray)
        }
        .padding(.horizontal, 6)
        .padding(.vertical, 3)
        .background(levelColor.opacity(0.12))
        .cornerRadius(6)
    }
}
