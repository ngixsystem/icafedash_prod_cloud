import SwiftUI

struct FaceitRankingsView: View {
    @State private var players: [FaceitRankingPlayer] = []
    @State private var isLoading = true

    private let accent = Color(hex: "#FF7800")

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().tint(accent).padding(.top, 60)
            } else {
                LazyVStack(spacing: 6) {
                    ForEach(Array(players.enumerated()), id: \.element.id) { idx, player in
                        HStack(spacing: 10) {
                            Text("#\(idx + 1)")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(idx < 3 ? accent : .gray)
                                .frame(width: 36)

                            AsyncImage(url: URL(string: player.avatar)) { image in
                                image.resizable().aspectRatio(contentMode: .fill)
                            } placeholder: {
                                Circle().fill(Color.white.opacity(0.1))
                            }
                            .frame(width: 34, height: 34)
                            .clipShape(Circle())

                            VStack(alignment: .leading, spacing: 2) {
                                Text(player.nickname)
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(.white)
                            }

                            Spacer()

                            FaceitLevelBadge(level: player.skill_level, elo: player.faceit_elo)
                        }
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(idx < 3 ? accent.opacity(0.06) : Color.clear)
                    }
                }
                .padding(.top, 8)
            }
        }
        .background(Color(hex: "#121315"))
        .navigationTitle("FACEIT UZ Рейтинг")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            players = (try? await APIService.shared.getFaceitRankings()) ?? []
            isLoading = false
        }
    }
}
