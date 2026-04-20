import SwiftUI

struct TournamentDetailView: View {
    let tournamentId: Int
    @State private var details: TournamentDetails?
    @State private var bracket: [FaceitBracketMatch] = []
    @State private var isLoading = true
    @State private var selectedTab = 0

    private let accent = Color(hex: "#FF7800")

    private static let isoFormatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()
    private static let isoFormatterShort = ISO8601DateFormatter()
    private static let displayFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "dd.MM.yyyy HH:mm"
        f.locale = Locale(identifier: "ru_RU")
        return f
    }()

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().tint(accent).padding(.top, 60)
            } else if let details {
                let t = details.tournament

                VStack(alignment: .leading, spacing: 0) {
                    // Banner
                    if let banner = t.banner_url, !banner.isEmpty {
                        AsyncImage(url: URL(string: APIService.shared.baseHost + banner)) { image in
                            image.resizable().aspectRatio(2340.0/600.0, contentMode: .fill)
                        } placeholder: {
                            Rectangle().fill(Color.white.opacity(0.05))
                                .aspectRatio(2340.0/600.0, contentMode: .fill)
                        }
                    }

                    VStack(alignment: .leading, spacing: 16) {
                        // Header
                        HStack(spacing: 12) {
                            if let logoUrl = t.logo_url, !logoUrl.isEmpty {
                                AsyncImage(url: URL(string: APIService.shared.baseHost + logoUrl)) { image in
                                    image.resizable().aspectRatio(contentMode: .fill)
                                } placeholder: {
                                    RoundedRectangle(cornerRadius: 12).fill(Color.white.opacity(0.1))
                                }
                                .frame(width: 50, height: 50)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                            }

                            VStack(alignment: .leading, spacing: 4) {
                                Text(t.title)
                                    .font(.system(size: 22, weight: .bold))
                                    .foregroundColor(.white)
                                Text("\(t.game) \u{2022} \(t.location ?? "Онлайн")")
                                    .font(.system(size: 13))
                                    .foregroundColor(.gray)
                            }
                        }

                        // Prize
                        if let prize = t.prize_pool, !prize.isEmpty {
                            HStack {
                                Image(systemName: "trophy.fill")
                                    .foregroundColor(accent)
                                Text(prize)
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(accent)
                            }
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(accent.opacity(0.1))
                            .cornerRadius(12)
                        }

                        // Info grid
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                            InfoCell(label: "Старт", value: formatDate(t.starts_at))
                            InfoCell(label: "Формат", value: t.team_format ?? "-")
                            InfoCell(label: "Чек-ин", value: formatDate(t.check_in_at))
                            InfoCell(label: "Сетка", value: t.format ?? "-")
                            InfoCell(label: "Взнос", value: t.entry_fee ?? "-")
                            InfoCell(label: "Команд", value: "\(t.registered_teams)/\(t.max_teams)")
                        }

                        // Description
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

                        // Stream player
                        if let streamUrl = t.stream_url, !streamUrl.isEmpty {
                            StreamSection(rawURL: streamUrl)
                        }

                        // Tabs: Teams / Bracket
                        Picker("", selection: $selectedTab) {
                            Text("Команды").tag(0)
                            Text("Сетка").tag(1)
                        }
                        .pickerStyle(.segmented)

                        if selectedTab == 0 {
                            // Registrations
                            if details.registrations.isEmpty {
                                Text("Нет зарегистрированных команд")
                                    .font(.system(size: 14))
                                    .foregroundColor(.gray)
                            } else {
                                ForEach(details.registrations) { reg in
                                    VStack(alignment: .leading, spacing: 8) {
                                        HStack {
                                            if !reg.team_logo_url.isEmpty {
                                                AsyncImage(url: URL(string: APIService.shared.baseHost + reg.team_logo_url)) { image in
                                                    image.resizable().aspectRatio(contentMode: .fill)
                                                } placeholder: {
                                                    Circle().fill(Color.white.opacity(0.1))
                                                }
                                                .frame(width: 30, height: 30)
                                                .clipShape(Circle())
                                            }
                                            Text(reg.team_name)
                                                .font(.system(size: 15, weight: .semibold))
                                                .foregroundColor(.white)
                                            if let tag = reg.team_tag {
                                                Text("[\(tag)]")
                                                    .font(.system(size: 12))
                                                    .foregroundColor(.gray)
                                            }
                                            Spacer()
                                        }

                                        // Members
                                        ForEach(reg.members) { member in
                                            HStack(spacing: 8) {
                                                AsyncImage(url: URL(string: member.avatar_url.hasPrefix("http") ? member.avatar_url : APIService.shared.baseHost + member.avatar_url)) { image in
                                                    image.resizable().aspectRatio(contentMode: .fill)
                                                } placeholder: {
                                                    Circle().fill(Color.white.opacity(0.1))
                                                }
                                                .frame(width: 24, height: 24)
                                                .clipShape(Circle())

                                                NavigationLink(destination: PlayerProfileView(playerId: member.id)) {
                                                    Text(member.username)
                                                        .font(.system(size: 13))
                                                        .foregroundColor(Color(hex: "#00B4D8"))
                                                }

                                                Spacer()

                                                if let elo = member.faceit_elo {
                                                    FaceitLevelBadge(level: member.faceit_level ?? 1, elo: elo)
                                                }
                                            }
                                        }
                                    }
                                    .padding(12)
                                    .background(Color.white.opacity(0.05))
                                    .cornerRadius(12)
                                }
                            }
                        } else {
                            // Bracket
                            if bracket.isEmpty {
                                Text("Сетка ещё не сгенерирована")
                                    .font(.system(size: 14))
                                    .foregroundColor(.gray)
                            } else {
                                ForEach(bracket) { match in
                                    VStack(spacing: 6) {
                                        Text("Раунд \(match.round) \u{2022} Матч \(match.match_number)")
                                            .font(.system(size: 11))
                                            .foregroundColor(.gray)
                                        HStack {
                                            Text(match.team1_name ?? "TBD")
                                                .font(.system(size: 14, weight: match.winner == match.team1_name ? .bold : .regular))
                                                .foregroundColor(match.winner == match.team1_name ? .green : .white)
                                            Spacer()
                                            Text("\(match.team1_score ?? 0) : \(match.team2_score ?? 0)")
                                                .font(.system(size: 14, weight: .bold))
                                                .foregroundColor(accent)
                                            Spacer()
                                            Text(match.team2_name ?? "TBD")
                                                .font(.system(size: 14, weight: match.winner == match.team2_name ? .bold : .regular))
                                                .foregroundColor(match.winner == match.team2_name ? .green : .white)
                                        }
                                    }
                                    .padding(12)
                                    .background(Color.white.opacity(0.05))
                                    .cornerRadius(12)
                                }
                            }
                        }
                    }
                    .padding(16)
                }
            }
        }
        .background(Color(hex: "#121315"))
        .navigationBarTitleDisplayMode(.inline)
        .task {
            do {
                async let d = APIService.shared.getTournamentDetails(id: tournamentId)
                async let b = APIService.shared.getFaceitBracket(tournamentId: tournamentId)
                details = try await d
                bracket = (try? await b.matches) ?? []
            } catch {
                print("Error: \(error)")
            }
            isLoading = false
        }
    }

    func formatDate(_ iso: String?) -> String {
        guard let iso else { return "-" }
        guard let date = Self.isoFormatter.date(from: iso) ?? Self.isoFormatterShort.date(from: iso) else { return iso }
        return Self.displayFormatter.string(from: date)
    }
}

struct InfoCell: View {
    let label: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(label)
                .font(.system(size: 11))
                .foregroundColor(.gray)
            Text(value)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.white)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(Color.white.opacity(0.05))
        .cornerRadius(10)
    }
}

struct StreamSection: View {
    let rawURL: String
    @State private var isExpanded = false

    private let accent = Color(hex: "#FF7800")

    var body: some View {
        VStack(spacing: 0) {
            Button {
                withAnimation(.easeInOut(duration: 0.3)) { isExpanded.toggle() }
            } label: {
                HStack(spacing: 10) {
                    ZStack {
                        Circle().fill(Color.red.opacity(0.15)).frame(width: 36, height: 36)
                        Image(systemName: isExpanded ? "stop.fill" : "play.tv.fill")
                            .font(.system(size: 15))
                            .foregroundColor(.red)
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Прямой эфир")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.white)
                        Text(isExpanded ? "Нажмите чтобы скрыть" : "Нажмите чтобы смотреть")
                            .font(.system(size: 11))
                            .foregroundColor(Color(hex: "#a5adba"))
                    }
                    Spacer()
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(Color(hex: "#a5adba"))
                }
                .padding(12)
                .background(Color(hex: "#1E1F22"))
                .cornerRadius(isExpanded ? 12 : 12)
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(isExpanded ? Color.red.opacity(0.4) : Color(hex: "#2F3136"), lineWidth: 1))
            }
            .buttonStyle(.plain)

            if isExpanded, let embedURL = streamEmbedURL(from: rawURL) {
                StreamPlayerView(embedURL: embedURL)
                    .frame(height: 210)
                    .cornerRadius(12)
                    .padding(.top, 6)
            }
        }
    }
}
