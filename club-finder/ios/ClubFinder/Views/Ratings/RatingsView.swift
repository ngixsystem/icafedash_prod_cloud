import SwiftUI

struct RatingsView: View {
    private let accent = Color(hex: "#FF7800")

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                NavigationLink(destination: FaceitRankingsView()) {
                    RatingCard(
                        title: "FACEIT Uzbekistan",
                        subtitle: "Топ-100 CS2 игроков",
                        icon: "crown.fill",
                        color: accent
                    )
                }
                .buttonStyle(.plain)
            }
            .padding()
        }
        .background(Color(hex: "#121315"))
        .navigationTitle("Рейтинги")
        .navigationBarTitleDisplayMode(.large)
    }
}

struct RatingCard: View {
    let title: String
    let subtitle: String
    let icon: String
    let color: Color

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundColor(color)
                .frame(width: 50, height: 50)
                .background(color.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 12))

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.white)
                Text(subtitle)
                    .font(.system(size: 13))
                    .foregroundColor(.gray)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .foregroundColor(.gray.opacity(0.5))
        }
        .padding(14)
        .background(Color.white.opacity(0.05))
        .cornerRadius(14)
    }
}
