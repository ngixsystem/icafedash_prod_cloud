# iOS ClubFinder Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the iOS ClubFinder app to 1:1 parity with the web version (cloud.icafedash.com) — fix broken navigation, add missing CYBER UNION ratings screens, replace Transfer tab with Ratings, and apply exact web design system.

**Architecture:** All changes are within `club-finder/ios/ClubFinder/`. Three new Swift files are added (CyberUnion.swift model, CyberUnionView.swift, RatingsHubView.swift). Two files are deleted (RatingsView.swift, TournamentGameRatingView.swift). `project.pbxproj` is updated to reflect all file additions and removals.

**Tech Stack:** SwiftUI (iOS 17+), `async/await`, URLSession, `NavigationStack` + `NavigationLink(value:)`, SF Symbols for all icons.

---

## File Map

| Action | File |
|--------|------|
| Create | `ClubFinder/Models/CyberUnion.swift` |
| Create | `ClubFinder/Views/Ratings/CyberUnionView.swift` |
| Create | `ClubFinder/Views/Ratings/RatingsHubView.swift` |
| Modify | `ClubFinder/Services/APIService.swift` |
| Modify | `ClubFinder/Views/MainTabView.swift` |
| Modify | `ClubFinder/Views/Home/HomeView.swift` |
| Modify | `ClubFinder/Views/Home/ClubCardView.swift` |
| Modify | `ClubFinder/Views/Club/ClubDetailView.swift` |
| Modify | `ClubFinder/Views/Tournaments/TournamentsView.swift` |
| Modify | `ClubFinder/Views/Tournaments/TournamentDetailView.swift` |
| Modify | `ClubFinder/Models/Tournament.swift` |
| Modify | `ClubFinder/Views/Profile/ProfileView.swift` |
| Modify | `ClubFinder/Views/Components/FaceitLevelBadge.swift` |
| Delete | `ClubFinder/Views/Ratings/RatingsView.swift` |
| Delete | `ClubFinder/Views/Tournaments/TournamentGameRatingView.swift` |
| Modify | `ClubFinder.xcodeproj/project.pbxproj` |

**New file UUIDs for project.pbxproj:**
- `CyberUnion.swift`: fileRef `CF1322CF1322CF1322CF1322`, buildFile `CF1420CF1420CF1420CF1420`
- `CyberUnionView.swift`: fileRef `CF1323CF1323CF1323CF1323`, buildFile `CF1421CF1421CF1421CF1421`
- `RatingsHubView.swift`: fileRef `CF1324CF1324CF1324CF1324`, buildFile `CF1422CF1422CF1422CF1422`

**Deleted file UUIDs to remove:**
- `RatingsView.swift`: fileRef `CF1319CF1319CF1319CF1319`, buildFile `CF1419CF1419CF1419CF1419`
- `TournamentGameRatingView.swift`: fileRef `CF131BCF131BCF131BCF131B`, buildFile `CF141BCF141BCF141BCF141B`

---

## Task 1: Create CyberUnion.swift models

**Files:**
- Create: `club-finder/ios/ClubFinder/Models/CyberUnion.swift`

- [ ] **Step 1: Create the file**

```swift
import Foundation

struct CyberUnionTeam: Codable, Identifiable {
    let id: Int
    let team_name: String
    let logo_url: String?
    let score: Int
    let rank: Int
}

struct CyberUnionPlayer: Codable, Identifiable {
    let id: Int
    let username: String
    let avatar_url: String?
    let faceit_elo: Int?
    let faceit_level: Int?
    let score: Int
    let rank: Int
    let team_name: String?
}

struct CyberUnionTeamPlayer: Codable, Identifiable {
    let id: Int
    let username: String
    let avatar_url: String?
    let faceit_elo: Int?
    let faceit_level: Int?
}

struct CyberUnionTeamsResponse: Codable {
    let items: [CyberUnionTeam]
    let total: Int
}

struct CyberUnionPlayersResponse: Codable {
    let items: [CyberUnionPlayer]
    let total: Int
}
```

- [ ] **Step 2: Commit**

```bash
cd club-finder/ios
git add ClubFinder/Models/CyberUnion.swift
git commit -m "feat(ios): add CyberUnion models"
```

---

## Task 2: Add CYBER UNION API methods to APIService.swift

**Files:**
- Modify: `club-finder/ios/ClubFinder/Services/APIService.swift`

The `APIService.swift` already has a `// MARK: - Rankings` section at line 222. Add the CYBER UNION methods after it, before the closing brace.

- [ ] **Step 1: Add CYBER UNION methods**

In `APIService.swift`, find the `// MARK: - Cashback` section and add the new MARKS section before it:

```swift
    // MARK: - CYBER UNION
    func getCyberUnionTeams(game: String, page: Int, limit: Int = 20) async throws -> CyberUnionTeamsResponse {
        try await request("/public/cyberunion/teams", queryItems: [
            .init(name: "game", value: game),
            .init(name: "page", value: "\(page)"),
            .init(name: "limit", value: "\(limit)")
        ])
    }

    func getCyberUnionPlayers(game: String, page: Int, limit: Int = 20) async throws -> CyberUnionPlayersResponse {
        try await request("/public/cyberunion/players", queryItems: [
            .init(name: "game", value: game),
            .init(name: "page", value: "\(page)"),
            .init(name: "limit", value: "\(limit)")
        ])
    }

    func getCyberUnionTeamPlayers(game: String, teamName: String) async throws -> [CyberUnionTeamPlayer] {
        try await request("/public/cyberunion/team-players", queryItems: [
            .init(name: "game", value: game),
            .init(name: "team_name", value: teamName)
        ])
    }
```

- [ ] **Step 2: Commit**

```bash
git add ClubFinder/Services/APIService.swift
git commit -m "feat(ios): add CYBER UNION API methods"
```

---

## Task 3: Fix Tournament.swift — make non-critical fields optional

**Files:**
- Modify: `club-finder/ios/ClubFinder/Models/Tournament.swift`

The current `PublicTournament` model has non-optional `String` fields for `description`, `team_format`, `location`, `format`, `prize_pool`, `entry_fee`, `stream_url`, `faceit_championship_id`, `region`, `logo_url`. If the API returns `null` for any of these, JSON decoding throws an error and no tournaments are shown. Fix: make them optional.

- [ ] **Step 1: Replace PublicTournament struct**

Replace the entire `struct PublicTournament` in `Tournament.swift`:

```swift
struct PublicTournament: Codable, Identifiable {
    let id: Int
    let title: String
    let game: String
    let description: String?
    let team_format: String?
    let location: String?
    let starts_at: String?
    let check_in_at: String?
    let status: String
    let format: String?
    let max_teams: Int
    let prize_pool: String?
    let entry_fee: String?
    let stream_url: String?
    let faceit_championship_id: String?
    let region: String?
    let logo_url: String?
    let banner_url: String?
    let registered_teams: Int
}
```

- [ ] **Step 2: Fix all usages broken by optionals**

In `TournamentsView.swift`, `TournamentCardView` references `tournament.logo_url` and `tournament.banner_url`. Update `TournamentCardView.body` to guard on nil logo_url:

Change:
```swift
if !tournament.logo_url.isEmpty {
```
To:
```swift
if let logoUrl = tournament.logo_url, !logoUrl.isEmpty {
    AsyncImage(url: URL(string: APIService.shared.baseHost + logoUrl)) { image in
        image.resizable().aspectRatio(contentMode: .fill)
    } placeholder: {
        RoundedRectangle(cornerRadius: 10).fill(Color.white.opacity(0.1))
    }
    .frame(width: 40, height: 40)
    .clipShape(RoundedRectangle(cornerRadius: 10))
}
```

In `TournamentDetailView.swift`, fix:
- `if !t.logo_url.isEmpty` → `if let logoUrl = t.logo_url, !logoUrl.isEmpty` (update the AsyncImage URL accordingly)
- `if !t.prize_pool.isEmpty` → `if let prize = t.prize_pool, !prize.isEmpty`
- `if !t.description.isEmpty` → `if let desc = t.description, !desc.isEmpty`
- `if !t.stream_url.isEmpty, let url = URL(string: t.stream_url)` → `if let streamUrl = t.stream_url, !streamUrl.isEmpty, let url = URL(string: streamUrl)`
- All other `t.xxx` where xxx was non-optional: use `.isEmpty ? "-" : x` pattern — now use `x ?? "-"`
- In `InfoCell` calls: `t.team_format ?? "-"`, `t.format ?? "-"`, `t.entry_fee ?? "-"`, `t.location` is used in `"\(t.game) \u{2022} \(t.location.isEmpty ? "Онлайн" : t.location)"` → `"\(t.game) \u{2022} \(t.location?.isEmpty == false ? t.location! : "Онлайн")"`

In `TournamentDetailView.swift`, the `NavigationLink` to `TournamentGameRatingView` uses `t.game`. This will be REMOVED in Task 8, so just leave `t.game` usage in other places as-is (`.game` is still non-optional).

- [ ] **Step 3: Commit**

```bash
git add ClubFinder/Models/Tournament.swift ClubFinder/Views/Tournaments/TournamentsView.swift ClubFinder/Views/Tournaments/TournamentDetailView.swift
git commit -m "fix(ios): make Tournament optional fields to fix decoding crash"
```

---

## Task 4: Fix HomeView club tap — NavigationLink(value:)

**Files:**
- Modify: `club-finder/ios/ClubFinder/Views/Home/HomeView.swift`

Currently line 70 uses `NavigationLink(destination: ClubDetailView(clubId: club.id))` which can conflict with `NavigationStack` + `LazyVStack`. Fix: use `NavigationLink(value:)` with `.navigationDestination`.

- [ ] **Step 1: Replace NavigationLink in HomeView.swift**

In `HomeView.body`, find the `LazyVStack` with `ForEach(filteredClubs)` and replace:

```swift
// OLD (lines 68-75):
LazyVStack(spacing: 12) {
    ForEach(filteredClubs) { club in
        NavigationLink(destination: ClubDetailView(clubId: club.id)) {
            ClubCardView(club: club)
        }
        .buttonStyle(.plain)
    }
}
.padding(.horizontal)
```

With:

```swift
LazyVStack(spacing: 12) {
    ForEach(filteredClubs) { club in
        NavigationLink(value: club.id) {
            ClubCardView(club: club)
        }
        .buttonStyle(.plain)
    }
}
.padding(.horizontal)
.navigationDestination(for: Int.self) { clubId in
    ClubDetailView(clubId: clubId)
}
```

- [ ] **Step 2: Commit**

```bash
git add ClubFinder/Views/Home/HomeView.swift
git commit -m "fix(ios): use NavigationLink(value:) for club tap navigation"
```

---

## Task 5: Create CyberUnionView.swift

**Files:**
- Create: `club-finder/ios/ClubFinder/Views/Ratings/CyberUnionView.swift`

This is the main CYBER UNION screen — teams/players tabs with pagination and expandable team rosters.

- [ ] **Step 1: Create CyberUnionView.swift**

```swift
import SwiftUI

struct CyberUnionView: View {
    let game: String

    @State private var selectedTab = 0
    @State private var teams: [CyberUnionTeam] = []
    @State private var players: [CyberUnionPlayer] = []
    @State private var teamPlayers: [Int: [CyberUnionTeamPlayer]] = [:]
    @State private var expandedTeams: Set<Int> = []
    @State private var teamsPage = 1
    @State private var playersPage = 1
    @State private var teamsTotal = 0
    @State private var playersTotal = 0
    @State private var isLoadingTeams = true
    @State private var isLoadingPlayers = true
    @State private var isLoadingMore = false

    private let accent = Color(hex: "#FF7800")
    private static let rankColors: [Int: Color] = [
        1: Color(hex: "#FEE75C"),
        2: Color(hex: "#C0C0C0"),
        3: Color(hex: "#CD7F32")
    ]
    private let pageLimit = 20

    var displayTitle: String {
        switch game {
        case "cs2": return "CYBER UNION CS2"
        case "pubg-mobile": return "CYBER UNION PUBG MOBILE"
        default: return "CYBER UNION"
        }
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
                teamsList
            } else {
                playersList
            }
        }
        .background(Color(hex: "#0B0D12"))
        .navigationTitle(displayTitle)
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadTeams(reset: true)
            await loadPlayers(reset: true)
        }
        .onChange(of: selectedTab) { _ in }
    }

    // MARK: - Teams Tab

    private var teamsList: some View {
        ScrollView {
            LazyVStack(spacing: 8) {
                if isLoadingTeams {
                    ProgressView().tint(accent).frame(maxWidth: .infinity).padding(.top, 40)
                } else if teams.isEmpty {
                    Text("Команды не найдены")
                        .foregroundColor(Color(hex: "#a5adba"))
                        .padding(.top, 40)
                } else {
                    ForEach(teams) { team in
                        teamRow(team)
                    }

                    if teams.count < teamsTotal {
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

    private func teamRow(_ team: CyberUnionTeam) -> some View {
        let isExpanded = expandedTeams.contains(team.id)
        let rankColor = Self.rankColors[team.rank] ?? Color(hex: "#a5adba")

        return VStack(spacing: 0) {
            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    if isExpanded {
                        expandedTeams.remove(team.id)
                    } else {
                        expandedTeams.insert(team.id)
                        if teamPlayers[team.id] == nil {
                            Task { await loadTeamPlayers(team: team) }
                        }
                    }
                }
            } label: {
                HStack(spacing: 10) {
                    Text("#\(team.rank)")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(rankColor)
                        .frame(width: 28, alignment: .leading)

                    if let logo = team.logo_url, !logo.isEmpty {
                        AsyncImage(url: URL(string: logo.hasPrefix("http") ? logo : APIService.shared.baseHost + logo)) { img in
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

                    Text(team.team_name)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.white)
                        .lineLimit(1)

                    Spacer()

                    HStack(spacing: 3) {
                        Text("\(team.score)")
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
                if let members = teamPlayers[team.id] {
                    ForEach(members) { member in
                        HStack(spacing: 10) {
                            Color.clear.frame(width: 28)
                            if let av = member.avatar_url, !av.isEmpty {
                                AsyncImage(url: URL(string: av.hasPrefix("http") ? av : APIService.shared.baseHost + av)) { img in
                                    img.resizable().aspectRatio(contentMode: .fill)
                                } placeholder: {
                                    Circle().fill(Color(hex: "#2F3136"))
                                }
                                .frame(width: 24, height: 24)
                                .clipShape(Circle())
                            } else {
                                Circle().fill(Color(hex: "#2F3136")).frame(width: 24, height: 24)
                            }
                            Text(member.username)
                                .font(.system(size: 13))
                                .foregroundColor(Color(hex: "#a5adba"))
                            Spacer()
                            if let elo = member.faceit_elo, let level = member.faceit_level {
                                FaceitLevelBadge(level: level, elo: elo)
                            }
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
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

    // MARK: - Players Tab

    private var playersList: some View {
        ScrollView {
            LazyVStack(spacing: 8) {
                if isLoadingPlayers {
                    ProgressView().tint(accent).frame(maxWidth: .infinity).padding(.top, 40)
                } else if players.isEmpty {
                    Text("Игроки не найдены")
                        .foregroundColor(Color(hex: "#a5adba"))
                        .padding(.top, 40)
                } else {
                    ForEach(players) { player in
                        playerRow(player)
                    }

                    if players.count < playersTotal {
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

    private func playerRow(_ player: CyberUnionPlayer) -> some View {
        let rankColor = Self.rankColors[player.rank] ?? Color(hex: "#a5adba")
        return HStack(spacing: 10) {
            Text("#\(player.rank)")
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(rankColor)
                .frame(width: 28, alignment: .leading)

            if let av = player.avatar_url, !av.isEmpty {
                AsyncImage(url: URL(string: av.hasPrefix("http") ? av : APIService.shared.baseHost + av)) { img in
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
                Text(player.username)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.white)
                if let team = player.team_name {
                    Text(team)
                        .font(.system(size: 11))
                        .foregroundColor(Color(hex: "#a5adba"))
                }
            }

            Spacer()

            if let elo = player.faceit_elo, let level = player.faceit_level {
                FaceitLevelBadge(level: level, elo: elo)
            }

            HStack(spacing: 3) {
                Text("\(player.score)")
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

    // MARK: - Loading

    private func loadTeams(reset: Bool) async {
        if reset {
            teamsPage = 1
            isLoadingTeams = true
        } else {
            isLoadingMore = true
            teamsPage += 1
        }
        do {
            let resp = try await APIService.shared.getCyberUnionTeams(game: game, page: teamsPage, limit: pageLimit)
            if reset {
                teams = resp.items
            } else {
                teams.append(contentsOf: resp.items)
            }
            teamsTotal = resp.total
        } catch {}
        isLoadingTeams = false
        isLoadingMore = false
    }

    private func loadPlayers(reset: Bool) async {
        if reset {
            playersPage = 1
            isLoadingPlayers = true
        } else {
            isLoadingMore = true
            playersPage += 1
        }
        do {
            let resp = try await APIService.shared.getCyberUnionPlayers(game: game, page: playersPage, limit: pageLimit)
            if reset {
                players = resp.items
            } else {
                players.append(contentsOf: resp.items)
            }
            playersTotal = resp.total
        } catch {}
        isLoadingPlayers = false
        isLoadingMore = false
    }

    private func loadTeamPlayers(team: CyberUnionTeam) async {
        do {
            let members = try await APIService.shared.getCyberUnionTeamPlayers(game: game, teamName: team.team_name)
            teamPlayers[team.id] = members
        } catch {
            teamPlayers[team.id] = []
        }
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add ClubFinder/Views/Ratings/CyberUnionView.swift
git commit -m "feat(ios): add CyberUnionView with teams/players tabs and pagination"
```

---

## Task 6: Create RatingsHubView.swift

**Files:**
- Create: `club-finder/ios/ClubFinder/Views/Ratings/RatingsHubView.swift`

This replaces the old `RatingsView.swift`. It's a navigation hub with three sections: CYBER UNION, FACEIT, TRANSFER.

- [ ] **Step 1: Create RatingsHubView.swift**

```swift
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
                            iconName: "gamecontroller",
                            iconBg: Color(hex: "#FF7800"),
                            title: "CS2",
                            subtitle: "Команды и игроки"
                        )
                    }
                    .buttonStyle(.plain)

                    NavigationLink(value: "pubg-mobile") {
                        HubCard(
                            iconName: "iphone",
                            iconBg: Color(hex: "#FF7800"),
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
                        iconName: "crown",
                        iconBg: Color(hex: "#FF6309"),
                        title: "FACEIT Uzbekistan",
                        subtitle: "Топ-100 CS2 игроков"
                    )
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 16)
                .padding(.bottom, 16)

                Divider().background(Color(hex: "#2F3136")).padding(.horizontal, 16)

                // TRANSFER section
                sectionHeader("ТРАНСФЕР")

                NavigationLink(destination: TransferView()) {
                    HubCard(
                        iconName: "arrow.left.arrow.right",
                        iconBg: Color(hex: "#7C3AED"),
                        title: "Трансфер маркет",
                        subtitle: "LFT / LFS объявления"
                    )
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 16)
                .padding(.bottom, 16)
            }
            .padding(.top, 8)
        }
        .background(Color(hex: "#0B0D12"))
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
    let iconName: String
    let iconBg: Color
    let title: String
    let subtitle: String

    var body: some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(iconBg)
                    .frame(width: 44, height: 44)
                Image(systemName: iconName)
                    .font(.system(size: 20))
                    .foregroundColor(.white)
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
```

- [ ] **Step 2: Commit**

```bash
git add ClubFinder/Views/Ratings/RatingsHubView.swift
git commit -m "feat(ios): add RatingsHubView with CYBER UNION / FACEIT / Transfer sections"
```

---

## Task 7: Update MainTabView.swift — replace Transfer tab with Ratings

**Files:**
- Modify: `club-finder/ios/ClubFinder/Views/MainTabView.swift`

Replace the 4th tab (Transfer, `arrow.left.arrow.right`) with Ratings (`chart.bar.xaxis`). Update Clubs tab icon from `magnifyingglass` to `house`.

- [ ] **Step 1: Replace the entire MainTabView.swift content**

```swift
import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var auth: AuthService
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                HomeView()
            }
            .tabItem {
                Image(systemName: "house")
                Text("Клубы")
            }
            .tag(0)

            NavigationStack {
                MapScreenView()
            }
            .tabItem {
                Image(systemName: "map")
                Text("Карта")
            }
            .tag(1)

            NavigationStack {
                TournamentsView()
            }
            .tabItem {
                Image(systemName: "trophy")
                Text("Турниры")
            }
            .tag(2)

            NavigationStack {
                RatingsHubView()
            }
            .tabItem {
                Image(systemName: "chart.bar.xaxis")
                Text("Рейтинги")
            }
            .tag(3)

            NavigationStack {
                if auth.isLoggedIn {
                    ProfileView()
                } else {
                    AuthView()
                }
            }
            .tabItem {
                Image(systemName: "person")
                Text("Профиль")
            }
            .tag(4)
        }
        .tint(Color(hex: "#FF7800"))
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        let scanner = Scanner(string: hex)
        var rgbValue: UInt64 = 0
        scanner.scanHexInt64(&rgbValue)
        let r = Double((rgbValue & 0xFF0000) >> 16) / 255.0
        let g = Double((rgbValue & 0x00FF00) >> 8) / 255.0
        let b = Double(rgbValue & 0x0000FF) / 255.0
        self.init(red: r, green: g, blue: b)
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add ClubFinder/Views/MainTabView.swift
git commit -m "feat(ios): replace Transfer tab with Ratings tab, fix Clubs icon to house"
```

---

## Task 8: Update TournamentsView.swift — remove game ratings section

**Files:**
- Modify: `club-finder/ios/ClubFinder/Views/Tournaments/TournamentsView.swift`

Remove the "Рейтинги по играм" section (lines 36-62). Update background to `#0B0D12`. Update tournament card border to use `#FF7800` tinted overlay.

- [ ] **Step 1: Remove game ratings section and update colors**

In `TournamentsView.body`, remove the entire block:
```swift
// Game ratings section
VStack(alignment: .leading, spacing: 10) {
    ...
}
.padding(.horizontal)
.padding(.top, 8)
```

Change background color:
```swift
// OLD:
.background(Color(hex: "#121315"))
// NEW:
.background(Color(hex: "#0B0D12"))
```

In `TournamentCardView.body`, update the overlay for the card to use orange tint:
```swift
// OLD:
.overlay(
    RoundedRectangle(cornerRadius: 16)
        .stroke(Color.white.opacity(0.08), lineWidth: 1)
)
// NEW:
.overlay(
    RoundedRectangle(cornerRadius: 16)
        .stroke(
            LinearGradient(
                colors: [Color(hex: "#FF7800").opacity(0.3), Color.clear],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            ),
            lineWidth: 1
        )
)
```

Also update the card background color to match spec:
```swift
// OLD: .background(Color(hex: "#0D0E12"))
// NEW: .background(Color(hex: "#1E1F22"))
```

- [ ] **Step 2: Commit**

```bash
git add ClubFinder/Views/Tournaments/TournamentsView.swift
git commit -m "feat(ios): remove game ratings from Tournaments, update card design 1:1 web"
```

---

## Task 9: Update TournamentDetailView.swift — remove TournamentGameRatingView link

**Files:**
- Modify: `club-finder/ios/ClubFinder/Views/Tournaments/TournamentDetailView.swift`

Remove the NavigationLink to `TournamentGameRatingView` (lines 119-135). Also fix the optional field usages broken by Task 3.

- [ ] **Step 1: Remove NavigationLink to TournamentGameRatingView**

Find and remove the entire block:
```swift
// Game rating
NavigationLink(destination: TournamentGameRatingView(tournamentId: t.id, game: t.game)) {
    HStack {
        Image(systemName: "trophy.fill")
            .foregroundColor(Color(hex: "#FF7800"))
        Text("Рейтинг — \(t.game)")
            .font(.system(size: 15, weight: .semibold))
            .foregroundColor(.white)
        Spacer()
        Image(systemName: "chevron.right")
            .font(.system(size: 12))
            .foregroundColor(.gray)
    }
    .padding(14)
    .background(Color.white.opacity(0.05))
    .cornerRadius(12)
}
```

- [ ] **Step 2: Fix optional field usages**

Replace usages of formerly non-optional fields that are now optional after Task 3:

```swift
// Line ~46 logo display:
// OLD: if !t.logo_url.isEmpty {
//          AsyncImage(url: URL(string: APIService.shared.baseHost + t.logo_url))
// NEW:
if let logoUrl = t.logo_url, !logoUrl.isEmpty {
    AsyncImage(url: URL(string: APIService.shared.baseHost + logoUrl)) { image in
        image.resizable().aspectRatio(contentMode: .fill)
    } placeholder: {
        RoundedRectangle(cornerRadius: 12).fill(Color.white.opacity(0.1))
    }
    .frame(width: 50, height: 50)
    .clipShape(RoundedRectangle(cornerRadius: 12))
}

// Line ~60 game + location:
// OLD: Text("\(t.game) \u{2022} \(t.location.isEmpty ? "Онлайн" : t.location)")
// NEW:
Text("\(t.game) \u{2022} \(t.location?.isEmpty == false ? t.location! : "Онлайн")")

// Prize pool:
// OLD: if !t.prize_pool.isEmpty {
//          Text(t.prize_pool)
// NEW:
if let prize = t.prize_pool, !prize.isEmpty {
    HStack {
        Image(systemName: "trophy.fill").foregroundColor(accent)
        Text(prize)
            .font(.system(size: 16, weight: .bold))
            .foregroundColor(accent)
    }
    .padding(12)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(accent.opacity(0.1))
    .cornerRadius(12)
}

// InfoCell calls:
// OLD: InfoCell(label: "Формат", value: t.team_format)
// NEW: InfoCell(label: "Формат", value: t.team_format ?? "-")
// OLD: InfoCell(label: "Сетка", value: t.format)
// NEW: InfoCell(label: "Сетка", value: t.format ?? "-")
// OLD: InfoCell(label: "Взнос", value: t.entry_fee.isEmpty ? "-" : t.entry_fee)
// NEW: InfoCell(label: "Взнос", value: t.entry_fee?.isEmpty == false ? t.entry_fee! : "-")

// Description:
// OLD: if !t.description.isEmpty {
//          Text(t.description)
// NEW:
if let desc = t.description, !desc.isEmpty {
    VStack(alignment: .leading, spacing: 6) {
        Text("Описание")
            .font(.system(size: 15, weight: .semibold))
            .foregroundColor(.white)
        Text(desc)
            .font(.system(size: 13))
            .foregroundColor(.gray)
    }
}

// Stream URL:
// OLD: if !t.stream_url.isEmpty, let url = URL(string: t.stream_url) {
// NEW:
if let streamUrl = t.stream_url, !streamUrl.isEmpty, let url = URL(string: streamUrl) {
    Link(destination: url) {
        HStack {
            Image(systemName: "play.tv.fill")
            Text("Смотреть стрим")
                .font(.system(size: 14, weight: .semibold))
        }
        .foregroundColor(.white)
        .padding(12)
        .frame(maxWidth: .infinity)
        .background(Color.red.opacity(0.2))
        .cornerRadius(12)
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add ClubFinder/Views/Tournaments/TournamentDetailView.swift
git commit -m "fix(ios): remove TournamentGameRatingView link, fix optional fields in TournamentDetailView"
```

---

## Task 10: Update ProfileView.swift — add Transfer menu row

**Files:**
- Modify: `club-finder/ios/ClubFinder/Views/Profile/ProfileView.swift`

Add a Transfer row in the Actions section between "Мои бронирования" and "Настройки". Update `SettingsRow` to support orange icon background per web design.

- [ ] **Step 1: Add Transfer NavigationLink and update SettingsRow design**

In `ProfileView.body`, in the `// Actions` VStack, add Transfer link between BookingView and ProfileSettingsView:

```swift
// Actions
VStack(spacing: 8) {
    NavigationLink(destination: CashbackView()) {
        SettingsRow(icon: "creditcard", text: "Кэшбэк", iconBg: Color(hex: "#FF7800"))
    }

    NavigationLink(destination: BookingView()) {
        SettingsRow(icon: "calendar", text: "Мои бронирования", iconBg: Color(hex: "#FF7800"))
    }

    NavigationLink(destination: TransferView()) {
        SettingsRow(icon: "arrow.left.arrow.right", text: "Трансфер маркет", iconBg: Color(hex: "#7C3AED"))
    }

    NavigationLink(destination: ProfileSettingsView()) {
        SettingsRow(icon: "gearshape", text: "Настройки", iconBg: Color(hex: "#FF7800"))
    }

    Button {
        auth.logout()
    } label: {
        SettingsRow(icon: "rectangle.portrait.and.arrow.right", text: "Выйти", isDestructive: true, iconBg: Color(hex: "#ef4444"))
    }
}
```

- [ ] **Step 2: Update SettingsRow to support iconBg parameter**

Replace the existing `SettingsRow` struct:

```swift
struct SettingsRow: View {
    let icon: String
    let text: String
    var isDestructive = false
    var iconBg = Color(hex: "#FF7800")

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(isDestructive ? Color(hex: "#ef4444") : iconBg)
                    .frame(width: 36, height: 36)
                Image(systemName: icon)
                    .font(.system(size: 16))
                    .foregroundColor(.white)
            }

            Text(text)
                .font(.system(size: 15))
                .foregroundColor(isDestructive ? Color(hex: "#ef4444") : .white)

            Spacer()

            Image(systemName: "chevron.right")
                .font(.system(size: 12))
                .foregroundColor(Color(hex: "#a5adba").opacity(0.5))
        }
        .padding(14)
        .background(Color(hex: "#1E1F22"))
        .cornerRadius(12)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(hex: "#2F3136"), lineWidth: 1))
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add ClubFinder/Views/Profile/ProfileView.swift
git commit -m "feat(ios): add Transfer to Profile menu, redesign SettingsRow 1:1 web"
```

---

## Task 11: Redesign ClubCardView.swift — 1:1 web

**Files:**
- Modify: `club-finder/ios/ClubFinder/Views/Home/ClubCardView.swift`

Update colors and open/closed status badge to match web: `#1E1F22` bg, `#2F3136` border, exact status colors `#57F287`/`#ED4245`.

- [ ] **Step 1: Replace ClubCardView content**

```swift
import SwiftUI

struct ClubCardView: View {
    let club: Club
    @ObservedObject private var location = LocationService.shared

    private var capacityFraction: Double {
        guard club.pcsTotal > 0 else { return 0 }
        return Double(club.pcsFree) / Double(club.pcsTotal)
    }

    private var capacityColor: Color {
        if capacityFraction > 0.5 { return Color(hex: "#57F287") }
        if capacityFraction > 0.2 { return Color(hex: "#FEE75C") }
        return Color(hex: "#ED4245")
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Photo
            if let photo = club.main_photo_url ?? club.photos?.first {
                AsyncImage(url: URL(string: APIService.shared.baseHost + photo)) { image in
                    image.resizable().aspectRatio(contentMode: .fill)
                } placeholder: {
                    Rectangle().fill(Color(hex: "#2F3136"))
                }
                .frame(height: 140)
                .clipped()
            }

            VStack(alignment: .leading, spacing: 8) {
                // Name row
                HStack(spacing: 10) {
                    if let logo = club.logo {
                        AsyncImage(url: URL(string: APIService.shared.baseHost + logo)) { image in
                            image.resizable().aspectRatio(contentMode: .fill)
                        } placeholder: {
                            Circle().fill(Color(hex: "#2F3136"))
                        }
                        .frame(width: 36, height: 36)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                    }

                    Text(club.name)
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.white)
                        .lineLimit(1)

                    Spacer()

                    // Open/Closed badge
                    HStack(spacing: 4) {
                        Circle()
                            .fill(club.isOpen ? Color(hex: "#57F287") : Color(hex: "#ED4245"))
                            .frame(width: 7, height: 7)
                        Text(club.isOpen ? "Открыто" : "Закрыто")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(club.isOpen ? Color(hex: "#57F287") : Color(hex: "#ED4245"))
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background((club.isOpen ? Color(hex: "#57F287") : Color(hex: "#ED4245")).opacity(0.15))
                    .cornerRadius(6)
                }

                // Address
                HStack(spacing: 4) {
                    Image(systemName: "location.fill")
                        .font(.system(size: 10))
                        .foregroundColor(Color(hex: "#a5adba"))
                    Text(club.address)
                        .font(.system(size: 12))
                        .foregroundColor(Color(hex: "#a5adba"))
                        .lineLimit(1)
                }

                // Capacity bar
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text("\(club.pcsFree) свободно")
                            .font(.system(size: 11))
                            .foregroundColor(Color(hex: "#a5adba"))
                        Spacer()
                        Text("\(club.pcsTotal) всего")
                            .font(.system(size: 11))
                            .foregroundColor(Color(hex: "#a5adba"))
                    }
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 2)
                                .fill(Color(hex: "#272727"))
                                .frame(height: 4)
                            RoundedRectangle(cornerRadius: 2)
                                .fill(capacityColor)
                                .frame(width: geo.size.width * capacityFraction, height: 4)
                        }
                    }
                    .frame(height: 4)
                }

                // Bottom row: rating + distance + price
                HStack(spacing: 12) {
                    HStack(spacing: 3) {
                        Image(systemName: "star.fill")
                            .font(.system(size: 10))
                            .foregroundColor(Color(hex: "#FF7800"))
                        Text(String(format: "%.1f", club.rating))
                            .font(.system(size: 12))
                            .foregroundColor(Color(hex: "#a5adba"))
                    }

                    if let lat = club.lat, let lng = club.lng,
                       let dist = location.formatDistance(to: lat, lng: lng) {
                        HStack(spacing: 3) {
                            Image(systemName: "location")
                                .font(.system(size: 10))
                                .foregroundColor(Color(hex: "#a5adba"))
                            Text(dist)
                                .font(.system(size: 12))
                                .foregroundColor(Color(hex: "#a5adba"))
                        }
                    }

                    Spacer()

                    if let price = club.pricePerHour {
                        Text("\(Int(price)) сум/ч")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(Color(hex: "#FF7800"))
                    }
                }
            }
            .padding(12)
        }
        .background(Color(hex: "#1E1F22"))
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color(hex: "#2F3136"), lineWidth: 1)
        )
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add ClubFinder/Views/Home/ClubCardView.swift
git commit -m "feat(ios): redesign ClubCardView 1:1 web — colors, capacity bar, status badge"
```

---

## Task 12: Update HomeView.swift — search bar colors

**Files:**
- Modify: `club-finder/ios/ClubFinder/Views/Home/HomeView.swift`

Update background and search field to match web design.

- [ ] **Step 1: Update search bar and background**

In `HomeView.body`:

Change background color:
```swift
// OLD: .background(Color(hex: "#121315"))
// NEW: .background(Color(hex: "#0B0D12"))
```

Update the search field:
```swift
// OLD:
HStack {
    Image(systemName: "magnifyingglass")
        .foregroundColor(.gray)
    TextField("Поиск клуба...", text: $searchText)
        .foregroundColor(.white)
}
.padding(12)
.background(Color.white.opacity(0.08))
.cornerRadius(14)
.padding(.horizontal)

// NEW:
HStack {
    Image(systemName: "magnifyingglass")
        .foregroundColor(Color(hex: "#a5adba"))
    TextField("Поиск клуба...", text: $searchText)
        .foregroundColor(.white)
}
.padding(12)
.background(Color(hex: "#1E1F22"))
.cornerRadius(12)
.overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(hex: "#2F3136"), lineWidth: 1))
.padding(.horizontal)
```

- [ ] **Step 2: Commit**

```bash
git add ClubFinder/Views/Home/HomeView.swift
git commit -m "feat(ios): update HomeView search bar and bg color 1:1 web"
```

---

## Task 13: Update FaceitLevelBadge.swift — exact web colors

**Files:**
- Modify: `club-finder/ios/ClubFinder/Views/Components/FaceitLevelBadge.swift`

- [ ] **Step 1: Read the current FaceitLevelBadge**

Read `club-finder/ios/ClubFinder/Views/Components/FaceitLevelBadge.swift` to see current level color logic.

- [ ] **Step 2: Update level colors to match web**

Ensure the badge uses these exact colors:
- Level 1–4: `#808080`
- Level 5–7: `#FFC500`
- Level 8–9: `#FF6500`
- Level 10: `#FF0000`

Replace or add the `levelColor` computed property:

```swift
private var levelColor: Color {
    switch level {
    case 1...4: return Color(hex: "#808080")
    case 5...7: return Color(hex: "#FFC500")
    case 8...9: return Color(hex: "#FF6500")
    case 10: return Color(hex: "#FF0000")
    default: return Color(hex: "#808080")
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add ClubFinder/Views/Components/FaceitLevelBadge.swift
git commit -m "feat(ios): update FaceitLevelBadge colors 1:1 web"
```

---

## Task 14: Delete obsolete files

**Files:**
- Delete: `club-finder/ios/ClubFinder/Views/Ratings/RatingsView.swift`
- Delete: `club-finder/ios/ClubFinder/Views/Tournaments/TournamentGameRatingView.swift`

- [ ] **Step 1: Delete the files**

```bash
rm club-finder/ios/ClubFinder/Views/Ratings/RatingsView.swift
rm club-finder/ios/ClubFinder/Views/Tournaments/TournamentGameRatingView.swift
```

- [ ] **Step 2: Commit deletions**

```bash
git add -u
git commit -m "chore(ios): remove RatingsView and TournamentGameRatingView (replaced by RatingsHubView and CyberUnionView)"
```

---

## Task 15: Update project.pbxproj

**Files:**
- Modify: `club-finder/ios/ClubFinder.xcodeproj/project.pbxproj`

Add 3 new files, remove 2 deleted files. All edits are in three sections: `PBXBuildFile`, `PBXFileReference`, `PBXSourcesBuildPhase`.

- [ ] **Step 1: Add new PBXBuildFile entries**

In the `/* Begin PBXBuildFile section */`, add after the last existing line (`CF141FCF141FCF141FCF141F /* Assets.xcassets in Resources */`):

```
		CF1420CF1420CF1420CF1420 /* CyberUnion.swift in Sources */ = {isa = PBXBuildFile; fileRef = CF1322CF1322CF1322CF1322 /* CyberUnion.swift */; };
		CF1421CF1421CF1421CF1421 /* CyberUnionView.swift in Sources */ = {isa = PBXBuildFile; fileRef = CF1323CF1323CF1323CF1323 /* CyberUnionView.swift */; };
		CF1422CF1422CF1422CF1422 /* RatingsHubView.swift in Sources */ = {isa = PBXBuildFile; fileRef = CF1324CF1324CF1324CF1324 /* RatingsHubView.swift */; };
```

- [ ] **Step 2: Remove deleted PBXBuildFile entries**

Remove these two lines:
```
		CF1419CF1419CF1419CF1419 /* RatingsView.swift in Sources */ = {isa = PBXBuildFile; fileRef = CF1319CF1319CF1319CF1319 /* RatingsView.swift */; };
		CF141BCF141BCF141BCF141B /* TournamentGameRatingView.swift in Sources */ = {isa = PBXBuildFile; fileRef = CF131BCF131BCF131BCF131B /* TournamentGameRatingView.swift */; };
```

- [ ] **Step 3: Add new PBXFileReference entries**

In the `/* Begin PBXFileReference section */`, add after `CF1321CF1321CF1321CF1321 /* ClubFinder.app */`:

```
		CF1322CF1322CF1322CF1322 /* CyberUnion.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = CyberUnion.swift; sourceTree = "<group>"; };
		CF1323CF1323CF1323CF1323 /* CyberUnionView.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = CyberUnionView.swift; sourceTree = "<group>"; };
		CF1324CF1324CF1324CF1324 /* RatingsHubView.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = RatingsHubView.swift; sourceTree = "<group>"; };
```

- [ ] **Step 4: Remove deleted PBXFileReference entries**

Remove these two lines:
```
		CF1319CF1319CF1319CF1319 /* RatingsView.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = RatingsView.swift; sourceTree = "<group>"; };
		CF131BCF131BCF131BCF131B /* TournamentGameRatingView.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = TournamentGameRatingView.swift; sourceTree = "<group>"; };
```

- [ ] **Step 5: Update PBXSourcesBuildPhase — add new files**

In the `/* Begin PBXSourcesBuildPhase section */`, inside the `files = (` list, add:
```
				CF1420CF1420CF1420CF1420 /* CyberUnion.swift in Sources */,
				CF1421CF1421CF1421CF1421 /* CyberUnionView.swift in Sources */,
				CF1422CF1422CF1422CF1422 /* RatingsHubView.swift in Sources */,
```

- [ ] **Step 6: Remove deleted files from PBXSourcesBuildPhase**

Remove from the `files = (` list:
```
				CF1419CF1419CF1419CF1419 /* RatingsView.swift in Sources */,
				CF141BCF141BCF141BCF141B /* TournamentGameRatingView.swift in Sources */,
```

- [ ] **Step 7: Update PBXGroup — add new file references to correct groups**

In the Models group (find it by locating where `CF1307CF1307CF1307CF1307 /* Tournament.swift */` lives), add:
```
				CF1322CF1322CF1322CF1322 /* CyberUnion.swift */,
```

In the Ratings group (find it by locating `CF1318CF1318CF1318CF1318 /* FaceitRankingsView.swift */`), add:
```
				CF1323CF1323CF1323CF1323 /* CyberUnionView.swift */,
				CF1324CF1324CF1324CF1324 /* RatingsHubView.swift */,
```

And remove from Ratings group:
```
				CF1319CF1319CF1319CF1319 /* RatingsView.swift */,
```

In the Tournaments group (find by `CF131CCF131CCF131CCF131C /* TournamentsView.swift */`), remove:
```
				CF131BCF131BCF131BCF131B /* TournamentGameRatingView.swift */,
```

- [ ] **Step 8: Commit**

```bash
git add ClubFinder.xcodeproj/project.pbxproj
git commit -m "chore(ios): update project.pbxproj — add CyberUnion/RatingsHub files, remove obsolete files"
```

---

## Task 16: Final push

- [ ] **Step 1: Verify all files compile (check for obvious issues)**

```bash
git log --oneline -10
```

Expected: 10+ commits from this session visible.

- [ ] **Step 2: Push to remote**

```bash
git push origin main
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ 2.1 Club tap fix → Task 4
- ✅ 2.2 Tournaments fix → Task 3
- ✅ 2.3 TournamentGameRating removal → Tasks 8, 9, 14
- ✅ 3.1 RatingsHubView → Task 6
- ✅ 3.2 CyberUnionView → Task 5
- ✅ 3.3 CyberUnion models → Task 1
- ✅ 3.4 API methods → Task 2
- ✅ 4.1 MainTabView → Task 7
- ✅ 4.2 ProfileView Transfer → Task 10
- ✅ 4.3 HomeView fix → Task 4
- ✅ 4.4 TournamentsView → Task 8
- ✅ 4.5 TournamentDetailView → Task 9
- ✅ 5 Delete files → Task 14
- ✅ 7.3 Tab icons/colors → Task 7
- ✅ 7.4 HomeView cards → Tasks 11, 12
- ✅ 7.7 RatingsHubView design → Task 6
- ✅ 7.8 CyberUnionView design → Task 5
- ✅ 7.9 ProfileView design → Task 10
- ✅ 7.10 FaceitLevelBadge → Task 13
- ✅ project.pbxproj → Task 15
- ✅ Design: `#0B0D12` backgrounds → Tasks 7, 8, 12
- ✅ Design: `#1E1F22`/`#2F3136` cards → Tasks 10, 11

**Type consistency:**
- `CyberUnionTeam`, `CyberUnionPlayer`, `CyberUnionTeamPlayer`, `CyberUnionTeamsResponse`, `CyberUnionPlayersResponse` — defined in Task 1, used in Tasks 2 and 5. ✅
- `HubCard` — defined and used in Task 6 only. ✅
- `SettingsRow` — modified in Task 10, existing usages updated in same task. ✅
- `Color(hex:)` extension stays in `MainTabView.swift`, referenced everywhere. ✅

**Scope items NOT covered** (per spec section 8 — out of scope):
- ClubDetailView.swift full redesign (Oswald font) — font embedding not included because it requires adding a font file to the bundle, which is outside scope of this plan. The existing ClubDetailView already shows club name in bold, which is acceptable.
- iPad layout — out of scope.
