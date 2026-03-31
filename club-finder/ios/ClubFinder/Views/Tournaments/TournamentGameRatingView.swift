import SwiftUI

private struct GameTeam: Identifiable {
    let id: Int
    let name: String
    let points: Int
    let wins: Int
    let accent: Color
}

private struct GameRatingData {
    let title: String
    let imageName: String
    let teams: [GameTeam]
}

private let gameData: [String: GameRatingData] = [
    "cs2": GameRatingData(
        title: "CS2",
        imageName: "cs2-banner",
        teams: [
            GameTeam(id: 1, name: "TeamPro Sergeli",  points: 1280, wins: 14, accent: Color(hex: "#FEE75C")),
            GameTeam(id: 2, name: "Energy Gaming",    points: 1195, wins: 12, accent: Color(hex: "#C0C0C0")),
            GameTeam(id: 3, name: "Cloud1 Squad",     points: 1110, wins: 10, accent: Color(hex: "#CD7F32")),
            GameTeam(id: 4, name: "OpenSpace Crew",   points:  980, wins:  9, accent: Color(hex: "#FF7800")),
            GameTeam(id: 5, name: "Main Arena",       points:  910, wins:  8, accent: Color(hex: "#FF7800")),
        ]
    ),
    "dota2": GameRatingData(
        title: "Dota 2",
        imageName: "dota2-banner",
        teams: [
            GameTeam(id: 1, name: "Ancient Stars",   points: 1325, wins: 15, accent: Color(hex: "#FEE75C")),
            GameTeam(id: 2, name: "Radiant Force",   points: 1200, wins: 13, accent: Color(hex: "#C0C0C0")),
            GameTeam(id: 3, name: "Dire Squad",      points: 1090, wins: 11, accent: Color(hex: "#CD7F32")),
            GameTeam(id: 4, name: "MidLane Kings",   points:  990, wins:  9, accent: Color(hex: "#FF7800")),
            GameTeam(id: 5, name: "Roshan Hunters",  points:  920, wins:  8, accent: Color(hex: "#FF7800")),
        ]
    ),
    "pubg-mobile": GameRatingData(
        title: "PUBG Mobile",
        imageName: "pubg-banner",
        teams: [
            GameTeam(id: 1, name: "DropZone Five",   points: 1360, wins: 16, accent: Color(hex: "#FEE75C")),
            GameTeam(id: 2, name: "Survivor Unit",   points: 1230, wins: 13, accent: Color(hex: "#C0C0C0")),
            GameTeam(id: 3, name: "Zone Masters",    points: 1120, wins: 11, accent: Color(hex: "#CD7F32")),
            GameTeam(id: 4, name: "AirDrop Crew",    points: 1005, wins: 10, accent: Color(hex: "#FF7800")),
            GameTeam(id: 5, name: "Final Circle",    points:  940, wins:  8, accent: Color(hex: "#FF7800")),
        ]
    ),
]

struct TournamentGameRatingView: View {
    let gameId: String

    private let accent = Color(hex: "#FF7800")

    private var data: GameRatingData? { gameData[gameId] }

    var body: some View {
        ScrollView {
            if let d = data {
                VStack(alignment: .leading, spacing: 16) {
                    // Game header card
                    ZStack(alignment: .bottomLeading) {
                        if UIImage(named: d.imageName) != nil {
                            Image(d.imageName)
                                .resizable()
                                .scaledToFill()
                                .frame(maxWidth: .infinity)
                                .frame(height: 122)
                                .clipped()
                        } else {
                            Rectangle()
                                .fill(Color.white.opacity(0.05))
                                .frame(height: 122)
                        }
                        LinearGradient(
                            gradient: Gradient(colors: [.black.opacity(0.8), .clear]),
                            startPoint: .leading, endPoint: .trailing
                        )
                        HStack(spacing: 12) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(Color(hex: "#1A1B1F"))
                                    .frame(width: 40, height: 40)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 12)
                                            .stroke(Color(hex: "#2F3136"), lineWidth: 1)
                                    )
                                Image(systemName: "trophy.fill")
                                    .foregroundColor(accent)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(d.title)
                                    .font(.system(size: 30, weight: .bold))
                                    .foregroundColor(.white)
                                Text("Топ команд по рейтингу")
                                    .font(.system(size: 12))
                                    .foregroundColor(Color(hex: "#C4CAD2"))
                            }
                        }
                        .padding(14)
                    }
                    .cornerRadius(16)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color(hex: "#2F3136"), lineWidth: 1)
                    )

                    // Header row
                    HStack {
                        Text("Топ по рейтингу")
                            .font(.system(size: 26, weight: .bold))
                            .foregroundColor(.white)
                        Spacer()
                        Text("Сезон 2026")
                            .font(.system(size: 11))
                            .foregroundColor(Color(hex: "#949BA4"))
                            .textCase(.uppercase)
                    }

                    // Teams list
                    VStack(spacing: 8) {
                        ForEach(Array(d.teams.enumerated()), id: \.element.id) { idx, team in
                            HStack(spacing: 12) {
                                // Rank badge
                                ZStack {
                                    Circle()
                                        .fill(Color(hex: "#1E1E1E"))
                                        .frame(width: 28, height: 28)
                                        .overlay(Circle().stroke(Color(hex: "#2F3136"), lineWidth: 1))
                                    Text("\(idx + 1)")
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundColor(team.accent)
                                }

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(team.name)
                                        .font(.system(size: 14, weight: .semibold))
                                        .foregroundColor(.white)
                                    Text("Побед: \(team.wins)")
                                        .font(.system(size: 11))
                                        .foregroundColor(Color(hex: "#949BA4"))
                                }

                                Spacer()

                                VStack(alignment: .trailing, spacing: 2) {
                                    Text("\(team.points)")
                                        .font(.system(size: 14, weight: .bold))
                                        .foregroundColor(accent)
                                    Text("PTS")
                                        .font(.system(size: 10))
                                        .foregroundColor(Color(hex: "#949BA4"))
                                }
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 10)
                            .background(Color(hex: "#141414"))
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color(hex: "#2A2A2A"), lineWidth: 1)
                            )
                        }
                    }
                    .padding(12)
                    .background(
                        LinearGradient(
                            gradient: Gradient(colors: [Color(hex: "#151515"), Color(hex: "#101010")]),
                            startPoint: .top, endPoint: .bottom
                        )
                    )
                    .cornerRadius(16)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color(hex: "#2F3136"), lineWidth: 1)
                    )
                }
                .padding(.horizontal)
                .padding(.top, 12)
            } else {
                Text("Раздел не найден.")
                    .foregroundColor(.gray)
                    .padding(.top, 40)
            }
        }
        .background(Color(hex: "#121315"))
        .navigationTitle(data?.title ?? "Рейтинг")
        .navigationBarTitleDisplayMode(.inline)
    }
}
