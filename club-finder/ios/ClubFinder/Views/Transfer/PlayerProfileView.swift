import SwiftUI

struct PlayerProfileView: View {
    let playerId: Int
    @State private var player: PlayerProfile?
    @State private var faceitStats: FaceitStatsPayload?
    @State private var isLoading = true

    private let accent = Color(hex: "#FF7800")

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().tint(accent).padding(.top, 60)
            } else if let player {
                VStack(spacing: 16) {
                    // Avatar + Name
                    VStack(spacing: 10) {
                        if let avatar = player.avatar_url, !avatar.isEmpty {
                            AsyncImage(url: URL(string: avatar.hasPrefix("http") ? avatar : APIService.shared.baseHost + avatar)) { image in
                                image.resizable().aspectRatio(contentMode: .fill)
                            } placeholder: {
                                Circle().fill(Color.white.opacity(0.1))
                            }
                            .frame(width: 70, height: 70)
                            .clipShape(Circle())
                        }

                        Text(player.username)
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(.white)

                        if let level = player.faceit_level, let elo = player.faceit_elo {
                            FaceitLevelBadge(level: level, elo: elo)
                        }
                    }

                    // Team
                    if let team = player.team {
                        HStack(spacing: 8) {
                            if let logo = team.logo_url, !logo.isEmpty {
                                AsyncImage(url: URL(string: logo.hasPrefix("http") ? logo : APIService.shared.baseHost + logo)) { image in
                                    image.resizable().aspectRatio(contentMode: .fill)
                                } placeholder: {
                                    RoundedRectangle(cornerRadius: 6).fill(Color.white.opacity(0.1))
                                }
                                .frame(width: 28, height: 28)
                                .clipShape(RoundedRectangle(cornerRadius: 6))
                            }
                            Text(team.name)
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundColor(.white)
                            if let tag = team.tag {
                                Text("[\(tag)]")
                                    .font(.system(size: 12))
                                    .foregroundColor(.gray)
                            }
                        }
                        .padding(12)
                        .frame(maxWidth: .infinity)
                        .background(Color.white.opacity(0.05))
                        .cornerRadius(12)
                    }

                    // FACEIT Stats
                    if let stats = faceitStats {
                        FaceitStatsGridView(stats: stats.lifetime)
                    }

                    // Transfer listing
                    if let listing = player.transfer_listing {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack(spacing: 6) {
                                Text(listing.listing_type == "lft" ? "Ищет команду" : "Ищет игрока")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundColor(listing.listing_type == "lft" ? .cyan : .purple)
                                Text("• \(listing.game)")
                                    .font(.system(size: 13))
                                    .foregroundColor(.gray)
                                if let roles = listing.roles, !roles.isEmpty {
                                    Text("• \(roles)")
                                        .font(.system(size: 13))
                                        .foregroundColor(.gray)
                                }
                            }
                            if let desc = listing.description, !desc.isEmpty {
                                Text(desc)
                                    .font(.system(size: 13))
                                    .foregroundColor(.gray)
                            }
                            if let contact = listing.contact, !contact.isEmpty {
                                Text("Контакт: \(contact)")
                                    .font(.system(size: 13))
                                    .foregroundColor(Color(hex: "#00B4D8"))
                            }
                        }
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.white.opacity(0.05))
                        .cornerRadius(12)
                    }

                    // Tournament history
                    if let history = player.tournament_history, !history.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("История турниров")
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundColor(.white)

                            ForEach(history) { h in
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(h.title)
                                            .font(.system(size: 14, weight: .semibold))
                                            .foregroundColor(.white)
                                        Text("\(h.game) \u{2022} \(h.team_name)")
                                            .font(.system(size: 12))
                                            .foregroundColor(.gray)
                                    }
                                    Spacer()
                                    if let placement = h.placement {
                                        Text(placement)
                                            .font(.system(size: 13, weight: .bold))
                                            .foregroundColor(accent)
                                    }
                                }
                                .padding(10)
                                .background(Color.white.opacity(0.05))
                                .cornerRadius(10)
                            }
                        }
                    }
                }
                .padding(.horizontal)
            }
        }
        .background(Color(hex: "#121315"))
        .navigationBarTitleDisplayMode(.inline)
        .task {
            do {
                player = try await APIService.shared.getPlayerProfile(id: playerId)
                if player?.faceit_id != nil {
                    faceitStats = try? await APIService.shared.getPlayerFaceitStats(id: playerId)
                }
            } catch {
                print("Error: \(error)")
            }
            isLoading = false
        }
    }
}
