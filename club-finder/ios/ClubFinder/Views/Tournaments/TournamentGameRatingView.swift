import SwiftUI

struct TournamentGameRatingView: View {
    let tournamentId: Int?
    let game: String

    @State private var players: [GameRatingPlayer] = []
    @State private var isLoading = true
    @State private var loadError = false

    private let accent = Color(hex: "#FF7800")
    private static let rankColors: [Int: Color] = [
        1: Color(hex: "#FEE75C"),
        2: Color(hex: "#C0C0C0"),
        3: Color(hex: "#CD7F32"),
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // Game header
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
                        Text(game)
                            .font(.system(size: 24, weight: .bold))
                            .foregroundColor(.white)
                        Text("Рейтинг команд по победам")
                            .font(.system(size: 12))
                            .foregroundColor(Color(hex: "#C4CAD2"))
                    }
                    Spacer()
                }
                .padding(14)
                .background(Color(hex: "#1A1B1F"))
                .cornerRadius(16)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color(hex: "#2F3136"), lineWidth: 1)
                )

                HStack {
                    Text("Топ по рейтингу")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundColor(.white)
                    Spacer()
                    Text("Сезон 2026")
                        .font(.system(size: 11))
                        .foregroundColor(Color(hex: "#949BA4"))
                        .textCase(.uppercase)
                }

                if isLoading {
                    ProgressView().tint(accent).frame(maxWidth: .infinity).padding(.top, 40)
                } else if loadError {
                    VStack(spacing: 12) {
                        Text("Не удалось загрузить рейтинг")
                            .foregroundColor(.gray)
                        Button("Повторить") { Task { await load() } }
                            .foregroundColor(accent)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.top, 20)
                } else if tournamentId == nil {
                    Text("Выберите конкретный турнир для просмотра рейтинга")
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: .infinity)
                        .padding(.top, 20)
                } else if players.isEmpty {
                    Text("Рейтинг пока не сформирован")
                        .foregroundColor(.gray)
                        .frame(maxWidth: .infinity)
                        .padding(.top, 20)
                } else {
                    VStack(spacing: 8) {
                        ForEach(players) { player in
                            playerRow(player)
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
            }
            .padding(.horizontal)
            .padding(.top, 12)
        }
        .background(Color(hex: "#121315"))
        .navigationTitle(game)
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    private func playerRow(_ player: GameRatingPlayer) -> some View {
        let rankColor = Self.rankColors[player.rank] ?? accent
        return HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(Color(hex: "#1E1E1E"))
                    .frame(width: 28, height: 28)
                    .overlay(Circle().stroke(Color(hex: "#2F3136"), lineWidth: 1))
                Text("\(player.rank)")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(rankColor)
            }

            if let urlStr = player.avatar_url, !urlStr.isEmpty {
                let fullURL: URL? = urlStr.hasPrefix("http")
                    ? URL(string: urlStr)
                    : URL(string: APIService.shared.baseHost + urlStr)
                AsyncImage(url: fullURL) { image in
                    image.resizable().aspectRatio(contentMode: .fill)
                } placeholder: {
                    Circle().fill(Color.white.opacity(0.1))
                }
                .frame(width: 28, height: 28)
                .clipShape(Circle())
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(player.username)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.white)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text("\(player.score)")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(accent)
                Text("WINS")
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

    private func load() async {
        guard let id = tournamentId else { isLoading = false; return }
        isLoading = true
        loadError = false
        do {
            players = try await APIService.shared.getTournamentGameRating(id: id, game: game)
        } catch {
            loadError = true
        }
        isLoading = false
    }
}
