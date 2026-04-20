import SwiftUI

struct TournamentsView: View {
    @State private var tournaments: [PublicTournament] = []
    @State private var isLoading = true

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                if isLoading {
                    ProgressView()
                        .tint(Color(hex: "#FF7800"))
                        .padding(.top, 60)
                } else if tournaments.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "trophy")
                            .font(.system(size: 40))
                            .foregroundColor(.gray)
                        Text("Турниров пока нет")
                            .foregroundColor(.gray)
                    }
                    .padding(.top, 60)
                } else {
                    LazyVStack(spacing: 12) {
                        ForEach(tournaments) { t in
                            NavigationLink(destination: TournamentDetailView(tournamentId: t.id)) {
                                TournamentCardView(tournament: t)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal)
                    .padding(.top, 8)
                }

                // Game ratings section
                VStack(alignment: .leading, spacing: 10) {
                    Text("Рейтинги по играм")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(.white)

                    ForEach([("cs2", "CS2"), ("dota2", "Dota 2"), ("pubg-mobile", "PUBG Mobile")], id: \.0) { gameId, title in
                        NavigationLink(destination: TournamentGameRatingView(tournamentId: nil, game: title)) {
                            HStack {
                                Image(systemName: "trophy.fill")
                                    .foregroundColor(Color(hex: "#FF7800"))
                                Text(title)
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
                    }
                }
                .padding(.horizontal)
                .padding(.top, 8)
            }
        }
        .background(Color(hex: "#121315"))
        .navigationTitle("Турниры")
        .navigationBarTitleDisplayMode(.large)
        .task {
            tournaments = (try? await APIService.shared.getTournaments()) ?? []
            isLoading = false
        }
        .refreshable {
            tournaments = (try? await APIService.shared.getTournaments()) ?? []
        }
    }
}

struct TournamentCardView: View {
    let tournament: PublicTournament
    private let accent = Color(hex: "#FF7800")

    private static let isoFormatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()
    private static let isoFormatterShort = ISO8601DateFormatter()

    var daysUntil: String? {
        guard let startsAt = tournament.starts_at else { return nil }
        guard let date = Self.isoFormatter.date(from: startsAt) ?? Self.isoFormatterShort.date(from: startsAt) else { return nil }
        let days = Calendar.current.dateComponents([.day], from: Date(), to: date).day ?? 0
        if days < 0 { return "Завершён" }
        if days == 0 { return "Сегодня" }
        return "через \(days) дн."
    }

    var progressPercent: Double {
        guard tournament.max_teams > 0 else { return 0 }
        return Double(tournament.registered_teams) / Double(tournament.max_teams)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Banner
            if let banner = tournament.banner_url, !banner.isEmpty {
                AsyncImage(url: URL(string: APIService.shared.baseHost + banner)) { image in
                    image.resizable().aspectRatio(2340.0/600.0, contentMode: .fill)
                        .saturation(0)
                } placeholder: {
                    Rectangle().fill(Color.white.opacity(0.05))
                        .aspectRatio(2340.0/600.0, contentMode: .fill)
                }
                .clipped()
            }

            VStack(alignment: .leading, spacing: 10) {
                // Logo + Title + Prize
                HStack(spacing: 10) {
                    if let logoUrl = tournament.logo_url, !logoUrl.isEmpty {
                        AsyncImage(url: URL(string: APIService.shared.baseHost + logoUrl)) { image in
                            image.resizable().aspectRatio(contentMode: .fill)
                        } placeholder: {
                            RoundedRectangle(cornerRadius: 10).fill(Color.white.opacity(0.1))
                        }
                        .frame(width: 40, height: 40)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                    }

                    VStack(alignment: .leading, spacing: 2) {
                        Text(tournament.title)
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.white)
                        Text(tournament.game)
                            .font(.system(size: 12))
                            .foregroundColor(.gray)
                    }

                    Spacer()

                    if let prize = tournament.prize_pool, !prize.isEmpty {
                        Text(prize)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(accent)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(accent.opacity(0.12))
                            .cornerRadius(8)
                    }
                }

                // Info chips
                HStack(spacing: 8) {
                    if let days = daysUntil {
                        ChipView(icon: "clock", text: days)
                    }
                    if let teamFormat = tournament.team_format {
                        ChipView(icon: "gamecontroller", text: teamFormat)
                    }
                }

                // Progress
                HStack {
                    Image(systemName: "person.2")
                        .font(.system(size: 12))
                        .foregroundColor(.gray)
                    Text("\(tournament.registered_teams)")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.white)
                    Text("/ \(tournament.max_teams)")
                        .font(.system(size: 12))
                        .foregroundColor(.gray)

                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule()
                                .fill(Color.white.opacity(0.1))
                                .frame(height: 4)
                            Capsule()
                                .fill(accent)
                                .frame(width: geo.size.width * progressPercent, height: 4)
                        }
                    }
                    .frame(height: 4)

                    Text("\(Int(progressPercent * 100))%")
                        .font(.system(size: 12))
                        .foregroundColor(.gray)
                }
            }
            .padding(14)
        }
        .background(Color(hex: "#0D0E12"))
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
    }
}

struct ChipView: View {
    let icon: String
    let text: String

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 10))
            Text(text)
                .font(.system(size: 12))
        }
        .foregroundColor(.gray)
        .padding(.horizontal, 8)
        .padding(.vertical, 5)
        .background(Color.white.opacity(0.06))
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
    }
}
