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
        .background(.clear)
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

    private static let isoFull: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()
    private static let isoShort = ISO8601DateFormatter()

    private var dateLabel: String {
        guard let s = tournament.starts_at,
              let d = Self.isoFull.date(from: s) ?? Self.isoShort.date(from: s) else { return "Скоро" }
        let days = Calendar.current.dateComponents([.day], from: Date(), to: d).day ?? 0
        if days < 0  { return "Завершён" }
        if days == 0 { return "Сегодня" }
        return "через \(days) дн."
    }

    private var statusInfo: (label: String, color: Color) {
        switch tournament.status.lowercased() {
        case "active", "ongoing", "live":       return ("LIVE",        Color(hex: "#ED4245"))
        case "finished", "completed", "ended":  return ("Завершён",    Color(hex: "#5c6068"))
        case "registration", "open":            return ("Регистрация", Color(hex: "#57F287"))
        default:                                return ("Скоро",       Color(hex: "#FEE75C"))
        }
    }

    private var progressPercent: Double {
        guard tournament.max_teams > 0 else { return 0 }
        return min(Double(tournament.registered_teams) / Double(tournament.max_teams), 1)
    }

    private var progressColor: Color {
        progressPercent >= 1.0 ? Color(hex: "#ED4245") :
        progressPercent >= 0.7 ? Color(hex: "#FEE75C") : accent
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            bannerSection
            contentSection
        }
        .background(Color(hex: "#16171C"))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.07), lineWidth: 1))
        .shadow(color: .black.opacity(0.4), radius: 10, y: 4)
    }

    // MARK: - Banner (no GeometryReader — uses maxWidth: .infinity + fixed height + clipped)

    private var bannerSection: some View {
        ZStack(alignment: .top) {
            // Background image
            if let raw = tournament.banner_url, !raw.isEmpty,
               let url = URL(string: raw.hasPrefix("http") ? raw : APIService.shared.baseHost + raw) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let img):
                        img.resizable()
                            .scaledToFill()
                            .frame(maxWidth: .infinity)
                            .frame(height: 170)
                            .clipped()
                    default:
                        placeholder
                    }
                }
            } else {
                placeholder
            }

            // Bottom fade
            VStack {
                Spacer()
                LinearGradient(
                    colors: [Color(hex: "#16171C"), Color(hex: "#16171C").opacity(0.5), .clear],
                    startPoint: .bottom, endPoint: .top
                )
                .frame(height: 80)
            }
            .frame(height: 170)

            // Top row overlays
            HStack {
                // Game tag
                Text(tournament.game.uppercased())
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(accent)
                    .tracking(1)
                    .padding(.horizontal, 8).padding(.vertical, 4)
                    .background(Color.black.opacity(0.55))
                    .clipShape(Capsule())

                Spacer()

                // Status badge
                HStack(spacing: 4) {
                    if statusInfo.label == "LIVE" {
                        Circle().fill(Color(hex: "#ED4245")).frame(width: 5, height: 5)
                    }
                    Text(statusInfo.label)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(statusInfo.color)
                }
                .padding(.horizontal, 10).padding(.vertical, 5)
                .background(.ultraThinMaterial)
                .clipShape(Capsule())
            }
            .padding(.horizontal, 12).padding(.top, 10)

            // Prize pool bottom-right
            if let prize = tournament.prize_pool, !prize.isEmpty {
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        HStack(spacing: 5) {
                            Image(systemName: "trophy.fill")
                                .font(.system(size: 10))
                                .foregroundColor(accent)
                            Text(prize)
                                .font(.bebas(18))
                                .foregroundColor(accent)
                        }
                    }
                    .padding(.horizontal, 12).padding(.bottom, 10)
                }
                .frame(height: 170)
            }
        }
        .frame(height: 170)
        .clipped()
    }

    private var placeholder: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: "#1a1c24"), Color(hex: "#0f1018")],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
            Image(systemName: "trophy.fill")
                .font(.system(size: 44))
                .foregroundColor(Color(hex: "#2F3136"))
        }
        .frame(maxWidth: .infinity)
        .frame(height: 170)
    }

    // MARK: - Content

    private var contentSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Title + logo
            HStack(spacing: 10) {
                if let logoUrl = tournament.logo_url, !logoUrl.isEmpty,
                   let url = URL(string: logoUrl.hasPrefix("http") ? logoUrl : APIService.shared.baseHost + logoUrl) {
                    AsyncImage(url: url) { phase in
                        switch phase {
                        case .success(let img): img.resizable().scaledToFill()
                        default: Color.white.opacity(0.05)
                        }
                    }
                    .frame(width: 40, height: 40)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(tournament.title)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.white)
                        .lineLimit(1)
                    Text(dateLabel)
                        .font(.system(size: 12))
                        .foregroundColor(Color(hex: "#a5adba"))
                }
                Spacer()
            }
            .padding(.horizontal, 12)
            .padding(.top, 12)
            .padding(.bottom, 10)

            // Orange separator
            Rectangle()
                .fill(accent)
                .frame(height: 2)
                .padding(.horizontal, 12)

            // Stats row
            HStack(spacing: 0) {
                // Format
                if let fmt = tournament.team_format {
                    statCell(icon: "gamecontroller.fill", value: fmt)
                    Spacer()
                }

                // Teams
                HStack(spacing: 6) {
                    Image(systemName: "person.2.fill")
                        .font(.system(size: 11))
                        .foregroundColor(Color(hex: "#5c6068"))
                    ZStack(alignment: .leading) {
                        Capsule().fill(Color.white.opacity(0.1)).frame(width: 44, height: 4)
                        Capsule()
                            .fill(LinearGradient(colors: [progressColor, progressColor.opacity(0.6)],
                                                 startPoint: .leading, endPoint: .trailing))
                            .frame(width: 44 * progressPercent, height: 4)
                    }
                    Text("\(tournament.registered_teams)/\(tournament.max_teams)")
                        .font(.bebas(15))
                        .foregroundColor(.white)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
        }
    }

    private func statCell(icon: String, value: String) -> some View {
        HStack(spacing: 5) {
            Image(systemName: icon)
                .font(.system(size: 11))
                .foregroundColor(Color(hex: "#5c6068"))
            Text(value)
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(Color(hex: "#a5adba"))
        }
    }
}
