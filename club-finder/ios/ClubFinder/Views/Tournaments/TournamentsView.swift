import SwiftUI

struct TournamentsView: View {
    @State private var tournaments: [PublicTournament] = []
    @State private var isLoading = true

    private let accent = Color(hex: "#FF7800")

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView()
                    .tint(accent)
                    .padding(.top, 80)
            } else if tournaments.isEmpty {
                VStack(spacing: 16) {
                    Image(systemName: "trophy")
                        .font(.system(size: 48, weight: .thin))
                        .foregroundColor(Color(hex: "#2F3136"))
                    Text("Турниров пока нет")
                        .font(.system(size: 16, weight: .medium, design: .rounded))
                        .foregroundColor(Color(hex: "#5c6068"))
                }
                .padding(.top, 80)
            } else {
                LazyVStack(spacing: 16) {
                    ForEach(tournaments) { t in
                        NavigationLink(destination: TournamentDetailView(tournamentId: t.id)) {
                            TournamentCardView(tournament: t)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 12)
                .padding(.bottom, 20)
            }
        }
        .background(Color(hex: "#0B0D12"))
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

// MARK: - Card

struct TournamentCardView: View {
    let tournament: PublicTournament
    private let accent = Color(hex: "#FF7800")

    private static let isoFormatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()
    private static let isoFormatterShort = ISO8601DateFormatter()

    private var dateInfo: (label: String, color: Color) {
        guard let startsAt = tournament.starts_at,
              let date = Self.isoFormatter.date(from: startsAt) ?? Self.isoFormatterShort.date(from: startsAt)
        else { return ("Скоро", Color(hex: "#a5adba")) }

        let days = Calendar.current.dateComponents([.day], from: Date(), to: date).day ?? 0
        if days < 0   { return ("Завершён",      Color(hex: "#ED4245")) }
        if days == 0  { return ("Сегодня",        Color(hex: "#57F287")) }
        if days <= 3  { return ("через \(days) дн.", Color(hex: "#FEE75C")) }
        return ("через \(days) дн.", Color(hex: "#a5adba"))
    }

    private var statusInfo: (label: String, color: Color) {
        switch tournament.status.lowercased() {
        case "active", "ongoing", "live":
            return ("LIVE", Color(hex: "#ED4245"))
        case "finished", "completed", "ended":
            return ("Завершён", Color(hex: "#a5adba"))
        case "registration", "open":
            return ("Регистрация", Color(hex: "#57F287"))
        default:
            return ("Скоро", Color(hex: "#FEE75C"))
        }
    }

    private var progressPercent: Double {
        guard tournament.max_teams > 0 else { return 0 }
        return min(Double(tournament.registered_teams) / Double(tournament.max_teams), 1)
    }

    private var progressColor: Color {
        if progressPercent >= 1.0 { return Color(hex: "#ED4245") }
        if progressPercent >= 0.7 { return Color(hex: "#FEE75C") }
        return accent
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            bannerSection
            contentSection
        }
        .background(Color(hex: "#16171C"))
        .clipShape(RoundedRectangle(cornerRadius: 18))
        .overlay(
            RoundedRectangle(cornerRadius: 18)
                .stroke(Color.white.opacity(0.07), lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(0.4), radius: 12, x: 0, y: 6)
    }

    // MARK: Banner

    private var bannerSection: some View {
        GeometryReader { geo in
            ZStack(alignment: .bottom) {
                if let banner = tournament.banner_url, !banner.isEmpty {
                    AsyncImage(url: URL(string: banner.hasPrefix("http") ? banner : APIService.shared.baseHost + banner)) { phase in
                        switch phase {
                        case .success(let image):
                            image
                                .resizable()
                                .scaledToFill()
                                .frame(width: geo.size.width, height: 164)
                                .clipped()
                        default:
                            bannerPlaceholder
                                .frame(width: geo.size.width, height: 164)
                        }
                    }
                } else {
                    bannerPlaceholder
                        .frame(width: geo.size.width, height: 164)
                }

                // bottom fade into card
                LinearGradient(
                    colors: [Color(hex: "#16171C"), Color(hex: "#16171C").opacity(0.6), .clear],
                    startPoint: .bottom,
                    endPoint: .top
                )
                .frame(width: geo.size.width, height: 90)

                // status badge top-right
                VStack {
                    HStack {
                        Spacer()
                        statusBadge
                    }
                    Spacer()
                }
                .frame(width: geo.size.width, height: 164)
                .padding(12)
            }
        }
        .frame(height: 164)
    }

    private var bannerPlaceholder: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: "#1a1c24"), Color(hex: "#0f1018")],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            Image(systemName: "trophy.fill")
                .font(.system(size: 40))
                .foregroundColor(Color(hex: "#2F3136"))
        }
    }

    private var statusBadge: some View {
        HStack(spacing: 5) {
            if statusInfo.label == "LIVE" {
                Circle().fill(Color(hex: "#ED4245")).frame(width: 6, height: 6)
            }
            Text(statusInfo.label)
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .foregroundColor(statusInfo.color)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(.ultraThinMaterial)
        .clipShape(Capsule())
    }

    // MARK: Content

    private var contentSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Title row
            HStack(alignment: .top, spacing: 10) {
                if let logoUrl = tournament.logo_url, !logoUrl.isEmpty {
                    AsyncImage(url: URL(string: logoUrl.hasPrefix("http") ? logoUrl : APIService.shared.baseHost + logoUrl)) { phase in
                        switch phase {
                        case .success(let img):
                            img.resizable().scaledToFill()
                        default:
                            RoundedRectangle(cornerRadius: 10).fill(Color.white.opacity(0.06))
                        }
                    }
                    .frame(width: 46, height: 46)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }

                VStack(alignment: .leading, spacing: 3) {
                    Text(tournament.title)
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                        .lineLimit(1)
                    Text(tournament.game.uppercased())
                        .font(.system(size: 10, weight: .semibold, design: .rounded))
                        .foregroundColor(accent)
                        .tracking(1.2)
                }

                Spacer()

                if let prize = tournament.prize_pool, !prize.isEmpty {
                    VStack(alignment: .trailing, spacing: 2) {
                        Image(systemName: "trophy.fill")
                            .font(.system(size: 10))
                            .foregroundColor(accent)
                        Text(prize)
                            .font(.system(size: 14, weight: .black, design: .rounded))
                            .foregroundColor(accent)
                            .lineLimit(1)
                    }
                }
            }

            // Divider
            Rectangle()
                .fill(Color.white.opacity(0.06))
                .frame(height: 1)

            // Bottom row
            HStack(spacing: 0) {
                // Date chip
                HStack(spacing: 5) {
                    Image(systemName: "calendar")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(dateInfo.color)
                    Text(dateInfo.label)
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundColor(dateInfo.color)
                }

                if let fmt = tournament.team_format {
                    Color.white.opacity(0.12)
                        .frame(width: 1, height: 14)
                        .padding(.horizontal, 10)

                    HStack(spacing: 5) {
                        Image(systemName: "gamecontroller.fill")
                            .font(.system(size: 10))
                            .foregroundColor(Color(hex: "#a5adba"))
                        Text(fmt)
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                            .foregroundColor(Color(hex: "#a5adba"))
                    }
                }

                Spacer()

                // Teams + progress bar
                HStack(spacing: 6) {
                    Image(systemName: "person.2.fill")
                        .font(.system(size: 10))
                        .foregroundColor(Color(hex: "#5c6068"))

                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule()
                                .fill(Color.white.opacity(0.1))
                                .frame(height: 4)
                            Capsule()
                                .fill(LinearGradient(
                                    colors: [progressColor, progressColor.opacity(0.7)],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                ))
                                .frame(width: geo.size.width * progressPercent, height: 4)
                        }
                    }
                    .frame(width: 48, height: 4)

                    Text("\(tournament.registered_teams)/\(tournament.max_teams)")
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundColor(.white)
                }
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 14)
    }
}
