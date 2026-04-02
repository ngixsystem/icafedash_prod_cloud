import SwiftUI

struct FaceitLevelBadge: View {
    let level: Int
    let elo: Int

    private var levelColor: Color {
        switch level {
        case 1: return Color(hex: "#EEE")
        case 2: return Color(hex: "#1CE400")
        case 3: return Color(hex: "#1CE400")
        case 4: return Color(hex: "#FFC800")
        case 5: return Color(hex: "#FFC800")
        case 6: return Color(hex: "#FFC800")
        case 7: return Color(hex: "#FF6309")
        case 8: return Color(hex: "#FF6309")
        case 9: return Color(hex: "#FF6309")
        case 10: return Color(hex: "#FE1F00")
        default: return .gray
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
