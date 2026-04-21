import SwiftUI

struct RatingsHubView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // CYBER UNION section
                sectionHeader("CYBER UNION")

                VStack(spacing: 8) {
                    NavigationLink(value: "cs2") {
                        HubCard(
                            imageName: "cs2-logo",
                            iconBg: Color(hex: "#1a2a5e"),
                            title: "CS2",
                            subtitle: "Команды и игроки"
                        )
                    }
                    .buttonStyle(.plain)

                    NavigationLink(value: "pubg-mobile") {
                        HubCard(
                            imageName: "pubg-logo",
                            iconBg: Color(hex: "#111111"),
                            title: "PUBG Mobile",
                            subtitle: "Команды и игроки"
                        )
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 16)

                Divider().background(Color(hex: "#2F3136")).padding(.horizontal, 16)

                // FACEIT section
                sectionHeader("FACEIT")

                NavigationLink(destination: FaceitRankingsView()) {
                    HubCard(
                        imageName: "faceit-logo",
                        iconBg: Color(hex: "#111111"),
                        title: "FACEIT Uzbekistan",
                        subtitle: "Топ-100 CS2 игроков"
                    )
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 16)
                .padding(.bottom, 16)

            }
            .padding(.top, 8)
        }
        .background(.clear)
        .navigationTitle("Рейтинги")
        .navigationBarTitleDisplayMode(.large)
        .navigationDestination(for: String.self) { game in
            CyberUnionView(game: game)
        }
    }

    private func sectionHeader(_ text: String) -> some View {
        HStack {
            Text(text)
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(Color(hex: "#949BA4"))
                .tracking(1)
            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.top, 16)
        .padding(.bottom, 8)
    }
}

struct HubCard: View {
    var imageName: String? = nil
    var systemIcon: String? = nil
    let iconBg: Color
    let title: String
    let subtitle: String

    var body: some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(iconBg)
                    .frame(width: 48, height: 48)

                if let imageName {
                    Image(imageName)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 40, height: 40)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                } else if let systemIcon {
                    Image(systemName: systemIcon)
                        .font(.system(size: 20))
                        .foregroundColor(.white)
                }
            }

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(.white)
                Text(subtitle)
                    .font(.system(size: 12))
                    .foregroundColor(Color(hex: "#a5adba"))
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.system(size: 12))
                .foregroundColor(Color(hex: "#a5adba"))
        }
        .padding(14)
        .background(Color(hex: "#1a1b1f"))
        .cornerRadius(12)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(hex: "#2F3136"), lineWidth: 1))
    }
}
