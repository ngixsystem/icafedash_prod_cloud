import SwiftUI

struct CyberUnionView: View {
    let game: String

    @State private var selectedTab = 0
    @State private var teams: [CyberUnionTeam] = []
    @State private var players: [CyberUnionPlayer] = []
    @State private var teamMembers: [Int: [CyberUnionTeamPlayer]] = [:]
    @State private var expandedTeamIds: Set<Int> = []
    @State private var teamsPage = 1
    @State private var playersPage = 1
    @State private var teamsPageCount = 1
    @State private var playersPageCount = 1
    @State private var isLoadingTeams = true
    @State private var isLoadingPlayers = true
    @State private var isLoadingMore = false

    private let accent = Color(hex: "#FF7800")

    private func rankColor(at index: Int) -> Color {
        switch index {
        case 0: return Color(hex: "#FEE75C")
        case 1: return Color(hex: "#C0C0C0")
        case 2: return Color(hex: "#CD7F32")
        default: return Color(hex: "#a5adba")
        }
    }

    private var displayTitle: String {
        game == "cs2" ? "CYBER UNION CS2" : "CYBER UNION PUBG MOBILE"
    }

    var body: some View {
        VStack(spacing: 0) {
            Picker("", selection: $selectedTab) {
                Text("Команды").tag(0)
                Text("Игроки").tag(1)
            }
            .pickerStyle(.segmented)
            .padding(.horizontal, 16)
            .padding(.vertical, 12)

            if selectedTab == 0 {
                teamsListView
            } else {
                playersListView
            }
        }
        .background(.clear)
        .navigationTitle(displayTitle)
        .navigationBarTitleDisplayMode(.inline)
        .task {
            async let t: () = loadTeams(reset: true)
            async let p: () = loadPlayers(reset: true)
            await t
            await p
        }
    }

    // MARK: - Teams List

    private var teamsListView: some View {
        ScrollView {
            LazyVStack(spacing: 8) {
                if isLoadingTeams {
                    ProgressView().tint(accent).padding(.top, 40)
                } else if teams.isEmpty {
                    Text("Команды не найдены")
                        .foregroundColor(Color(hex: "#a5adba"))
                        .padding(.top, 40)
                } else {
                    ForEach(Array(teams.enumerated()), id: \.element.id) { index, team in
                        TeamRowView(
                            team: team,
                            rank: index + 1,
                            rankColor: rankColor(at: index),
                            isExpanded: expandedTeamIds.contains(team.id),
                            members: teamMembers[team.id],
                            game: game,
                            onToggle: {
                                withAnimation(.easeInOut(duration: 0.2)) {
                                    if expandedTeamIds.contains(team.id) {
                                        expandedTeamIds.remove(team.id)
                                    } else {
                                        expandedTeamIds.insert(team.id)
                                        if teamMembers[team.id] == nil {
                                            Task { await loadTeamMembers(team: team) }
                                        }
                                    }
                                }
                            }
                        )
                    }

                    if teamsPage < teamsPageCount {
                        Button {
                            Task { await loadTeams(reset: false) }
                        } label: {
                            if isLoadingMore {
                                ProgressView().tint(accent)
                            } else {
                                Text("Загрузить ещё")
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(accent)
                            }
                        }
                        .padding(.vertical, 16)
                        .frame(maxWidth: .infinity)
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 16)
        }
    }

    // MARK: - Players List

    private var playersListView: some View {
        ScrollView {
            LazyVStack(spacing: 8) {
                if isLoadingPlayers {
                    ProgressView().tint(accent).padding(.top, 40)
                } else if players.isEmpty {
                    Text("Игроки не найдены")
                        .foregroundColor(Color(hex: "#a5adba"))
                        .padding(.top, 40)
                } else {
                    ForEach(Array(players.enumerated()), id: \.element.id) { index, player in
                        PlayerRowView(
                            player: player,
                            rank: index + 1,
                            rankColor: rankColor(at: index)
                        )
                    }

                    if playersPage < playersPageCount {
                        Button {
                            Task { await loadPlayers(reset: false) }
                        } label: {
                            if isLoadingMore {
                                ProgressView().tint(accent)
                            } else {
                                Text("Загрузить ещё")
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(accent)
                            }
                        }
                        .padding(.vertical, 16)
                        .frame(maxWidth: .infinity)
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 16)
        }
    }

    // MARK: - Loading

    private func loadTeams(reset: Bool) async {
        if reset {
            isLoadingTeams = true
            teamsPage = 1
        } else {
            isLoadingMore = true
            teamsPage += 1
        }
        do {
            let resp = try await APIService.shared.getCyberUnionTeams(game: game, page: teamsPage)
            if reset { teams = resp.items } else { teams.append(contentsOf: resp.items) }
            teamsPageCount = resp.page_count
        } catch {}
        isLoadingTeams = false
        isLoadingMore = false
    }

    private func loadPlayers(reset: Bool) async {
        if reset {
            isLoadingPlayers = true
            playersPage = 1
        } else {
            isLoadingMore = true
            playersPage += 1
        }
        do {
            let resp = try await APIService.shared.getCyberUnionPlayers(game: game, page: playersPage)
            if reset { players = resp.items } else { players.append(contentsOf: resp.items) }
            playersPageCount = resp.page_count
        } catch {}
        isLoadingPlayers = false
        isLoadingMore = false
    }

    private func loadTeamMembers(team: CyberUnionTeam) async {
        do {
            let members = try await APIService.shared.getCyberUnionTeamPlayers(game: game, teamName: team.name)
            teamMembers[team.id] = members
        } catch {
            teamMembers[team.id] = []
        }
    }
}

// MARK: - TeamRowView

private struct TeamRowView: View {
    let team: CyberUnionTeam
    let rank: Int
    let rankColor: Color
    let isExpanded: Bool
    let members: [CyberUnionTeamPlayer]?
    let game: String
    let onToggle: () -> Void

    private let accent = Color(hex: "#FF7800")

    private var photoURL: URL? {
        guard !team.photo.isEmpty else { return nil }
        return team.photo.hasPrefix("http")
            ? URL(string: team.photo)
            : URL(string: APIService.shared.baseHost + team.photo)
    }

    private func memberPhotoURL(_ photo: String) -> URL? {
        guard !photo.isEmpty else { return nil }
        return photo.hasPrefix("http")
            ? URL(string: photo)
            : URL(string: APIService.shared.baseHost + photo)
    }

    var body: some View {
        VStack(spacing: 0) {
            Button(action: onToggle) {
                HStack(spacing: 10) {
                    Text("#\(rank)")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(rankColor)
                        .frame(width: 28, alignment: .leading)

                    if let url = photoURL {
                        AsyncImage(url: url) { img in
                            img.resizable().aspectRatio(contentMode: .fill)
                        } placeholder: {
                            RoundedRectangle(cornerRadius: 6).fill(Color(hex: "#2F3136"))
                        }
                        .frame(width: 32, height: 32)
                        .clipShape(RoundedRectangle(cornerRadius: 6))
                    } else {
                        RoundedRectangle(cornerRadius: 6)
                            .fill(Color(hex: "#2F3136"))
                            .frame(width: 32, height: 32)
                    }

                    Text(team.name)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.white)
                        .lineLimit(1)

                    Spacer()

                    HStack(spacing: 3) {
                        Text("\(team.points)")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(accent)
                        Text("WINS")
                            .font(.system(size: 10))
                            .foregroundColor(Color(hex: "#a5adba"))
                    }

                    Image(systemName: isExpanded ? "chevron.up" : "chevron.right")
                        .font(.system(size: 11))
                        .foregroundColor(Color(hex: "#a5adba"))
                }
                .padding(12)
            }
            .buttonStyle(.plain)

            if isExpanded {
                Divider().background(Color(hex: "#2F3136"))
                if let members = members {
                    if members.isEmpty {
                        Text("Состав не найден")
                            .font(.system(size: 12))
                            .foregroundColor(Color(hex: "#a5adba"))
                            .padding(12)
                    } else {
                        ForEach(members) { member in
                            MemberRowView(member: member, photoURL: memberPhotoURL(member.photo), accent: accent)
                        }
                    }
                } else {
                    ProgressView().tint(accent).frame(maxWidth: .infinity).padding(12)
                }
            }
        }
        .background(Color(hex: "#1a1b1f"))
        .cornerRadius(10)
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color(hex: "#2F3136"), lineWidth: 1))
    }
}

// MARK: - MemberRowView

private struct MemberRowView: View {
    let member: CyberUnionTeamPlayer
    let photoURL: URL?
    let accent: Color

    var body: some View {
        HStack(spacing: 10) {
            Color.clear.frame(width: 28)

            if let url = photoURL {
                AsyncImage(url: url) { img in
                    img.resizable().aspectRatio(contentMode: .fill)
                } placeholder: {
                    Circle().fill(Color(hex: "#2F3136"))
                }
                .frame(width: 24, height: 24)
                .clipShape(Circle())
            } else {
                Circle().fill(Color(hex: "#2F3136")).frame(width: 24, height: 24)
            }

            VStack(alignment: .leading, spacing: 1) {
                Text(member.nickname.isEmpty ? member.name : member.nickname)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.white)
                if !member.nickname.isEmpty && !member.name.isEmpty {
                    Text(member.name)
                        .font(.system(size: 11))
                        .foregroundColor(Color(hex: "#a5adba"))
                }
            }

            Spacer()

            HStack(spacing: 2) {
                Text("\(member.points)")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(accent)
                Text("WINS")
                    .font(.system(size: 9))
                    .foregroundColor(Color(hex: "#a5adba"))
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
    }
}

// MARK: - PlayerRowView

private struct PlayerRowView: View {
    let player: CyberUnionPlayer
    let rank: Int
    let rankColor: Color

    private let accent = Color(hex: "#FF7800")

    private var photoURL: URL? {
        guard !player.photo.isEmpty else { return nil }
        return player.photo.hasPrefix("http")
            ? URL(string: player.photo)
            : URL(string: APIService.shared.baseHost + player.photo)
    }

    var body: some View {
        HStack(spacing: 10) {
            Text("#\(rank)")
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(rankColor)
                .frame(width: 28, alignment: .leading)

            if let url = photoURL {
                AsyncImage(url: url) { img in
                    img.resizable().aspectRatio(contentMode: .fill)
                } placeholder: {
                    Circle().fill(Color(hex: "#2F3136"))
                }
                .frame(width: 32, height: 32)
                .clipShape(Circle())
            } else {
                Circle().fill(Color(hex: "#2F3136")).frame(width: 32, height: 32)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(player.nickname.isEmpty ? player.name : player.nickname)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.white)
                if let team = player.team {
                    Text(team)
                        .font(.system(size: 11))
                        .foregroundColor(Color(hex: "#a5adba"))
                }
            }

            Spacer()

            HStack(spacing: 3) {
                Text("\(player.points)")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(accent)
                Text("WINS")
                    .font(.system(size: 10))
                    .foregroundColor(Color(hex: "#a5adba"))
            }
        }
        .padding(12)
        .background(Color(hex: "#1a1b1f"))
        .cornerRadius(10)
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color(hex: "#2F3136"), lineWidth: 1))
    }
}
