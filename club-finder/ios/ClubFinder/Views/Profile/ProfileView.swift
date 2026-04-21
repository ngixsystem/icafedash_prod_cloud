import SwiftUI
import AuthenticationServices

struct ProfileView: View {
    @EnvironmentObject var auth: AuthService
    @State private var faceitStats: FaceitStatsPayload?
    @State private var faceitHistory: [FaceitMatch] = []
    @State private var selectedTab = 0
    @State private var faceitLoading = false
    @State private var faceitToast: String?
    @State private var showFaceitToast = false

    private let accent = Color(hex: "#FF7800")

    var body: some View {
        ScrollView {
            VStack(spacing: 28) {
                headerSection

                if let stats = faceitStats {
                    faceitStatsSection(stats)
                }

                VStack(spacing: 20) {
                    profileGroup(title: "АКТИВНОСТЬ") {
                        NavigationLink(destination: CashbackView()) {
                            ProfileRow(icon: "creditcard.fill", label: "Кэшбэк",
                                       iconBg: Color(hex: "#FF7800"))
                        }
                        .buttonStyle(.plain)

                        rowDivider

                        NavigationLink(destination: BookingView()) {
                            ProfileRow(icon: "calendar", label: "Мои бронирования",
                                       iconBg: Color(hex: "#3B82F6"))
                        }
                        .buttonStyle(.plain)
                    }

                    profileGroup(title: "ИГРОВОЙ ПРОФИЛЬ") {
                        NavigationLink(destination: TransferView().environmentObject(auth)) {
                            ProfileRow(icon: "arrow.left.arrow.right", label: "Трансфер маркет",
                                       iconBg: Color(hex: "#7C3AED"))
                        }
                        .buttonStyle(.plain)

                        rowDivider

                        faceitRow
                    }

                    profileGroup(title: "АККАУНТ") {
                        NavigationLink(destination: ProfileSettingsView()) {
                            ProfileRow(icon: "gearshape.fill", label: "Настройки",
                                       iconBg: Color(hex: "#6B7280"))
                        }
                        .buttonStyle(.plain)

                        rowDivider

                        Button { auth.logout() } label: {
                            ProfileRow(icon: "rectangle.portrait.and.arrow.right",
                                       label: "Выйти",
                                       iconBg: Color(hex: "#EF4444"),
                                       labelColor: Color(hex: "#EF4444"),
                                       showChevron: false)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal)
            }
            .padding(.bottom, 40)
        }
        .background(Color(hex: "#0B0D12"))
        .overlay(alignment: .bottom) {
            if showFaceitToast, let msg = faceitToast {
                Text(msg)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.white)
                    .padding(.horizontal, 16).padding(.vertical, 10)
                    .background(Color(hex: "#1E1E2E").opacity(0.95))
                    .cornerRadius(20)
                    .padding(.bottom, 90)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                    .animation(.easeInOut(duration: 0.3), value: showFaceitToast)
            }
        }
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            guard let token = auth.token, auth.user?.faceit_id != nil else { return }
            faceitStats = try? await APIService.shared.getFaceitStats(token: token)
            faceitHistory = (try? await APIService.shared.getFaceitHistory(token: token))?.matches ?? []
        }
    }

    // MARK: - Header

    private var headerSection: some View {
        VStack(spacing: 14) {
            ZStack {
                if let avatar = auth.user?.avatar_url, !avatar.isEmpty {
                    AsyncImage(url: URL(string: avatar.hasPrefix("http") ? avatar : APIService.shared.baseHost + avatar)) { phase in
                        if case .success(let img) = phase {
                            img.resizable().aspectRatio(contentMode: .fill)
                        } else {
                            Circle().fill(Color(hex: "#1E1F22"))
                        }
                    }
                    .frame(width: 90, height: 90)
                    .clipShape(Circle())
                } else {
                    ZStack {
                        Circle()
                            .fill(LinearGradient(
                                colors: [Color(hex: "#1E1F22"), Color(hex: "#2a2b30")],
                                startPoint: .topLeading, endPoint: .bottomTrailing))
                            .frame(width: 90, height: 90)
                        Image(systemName: "person.fill")
                            .font(.system(size: 40))
                            .foregroundColor(Color(hex: "#a5adba"))
                    }
                }
            }
            .overlay(Circle().stroke(accent, lineWidth: 2.5))
            .overlay(Circle().stroke(accent.opacity(0.2), lineWidth: 8))
            .shadow(color: accent.opacity(0.35), radius: 18)

            VStack(spacing: 6) {
                Text(auth.user?.username ?? "")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(.white)

                if let level = auth.user?.faceit_level, let elo = auth.user?.faceit_elo {
                    FaceitLevelBadge(level: level, elo: elo)
                } else {
                    Text(auth.user?.email ?? "")
                        .font(.system(size: 13))
                        .foregroundColor(Color(hex: "#6B7280"))
                }
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 32)
    }

    // MARK: - FACEIT Stats

    private func faceitStatsSection(_ stats: FaceitStatsPayload) -> some View {
        VStack(spacing: 12) {
            Picker("", selection: $selectedTab) {
                Text("Статистика").tag(0)
                Text("История").tag(1)
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)

            if selectedTab == 0 {
                FaceitStatsGridView(stats: stats.lifetime)
                    .padding(.horizontal)
            } else {
                LazyVStack(spacing: 6) {
                    ForEach(faceitHistory) { match in
                        matchRow(match)
                    }
                }
                .padding(.horizontal)
            }
        }
    }

    private func matchRow(_ match: FaceitMatch) -> some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 3)
                .fill(match.is_win == true ? Color(hex: "#57F287") : Color(hex: "#ED4245"))
                .frame(width: 4, height: 38)

            VStack(alignment: .leading, spacing: 2) {
                Text("\(match.team_name) vs \(match.opponent_name)")
                    .font(.system(size: 13, weight: .semibold)).foregroundColor(.white)
                HStack(spacing: 8) {
                    Text(match.map ?? "").font(.system(size: 11)).foregroundColor(.gray)
                    Text(match.score).font(.system(size: 11)).foregroundColor(.gray)
                }
            }
            Spacer()
            if let s = match.stats {
                VStack(alignment: .trailing, spacing: 2) {
                    Text("K/D: \(s.kd_ratio ?? "-")").font(.system(size: 11)).foregroundColor(.gray)
                    Text("\(s.kills ?? "0")/\(s.deaths ?? "0")/\(s.assists ?? "0")").font(.system(size: 11)).foregroundColor(.gray)
                }
            }
        }
        .padding(12)
        .background(Color(hex: "#1E1F22"))
        .cornerRadius(10)
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color(hex: "#2F3136"), lineWidth: 1))
    }

    // MARK: - FACEIT Row

    @ViewBuilder
    private var faceitRow: some View {
        if auth.user?.faceit_id == nil {
            Button {
                guard let token = auth.token else { return }
                faceitLoading = true
                Task {
                    do {
                        try await auth.linkFaceit(token: token)
                        showToast("FACEIT успешно привязан!")
                    } catch let e as ASWebAuthenticationSessionError where e.code == .canceledLogin {
                        showToast("Авторизация отменена")
                    } catch {
                        showToast(error.localizedDescription)
                    }
                    faceitLoading = false
                }
            } label: {
                ProfileRow(
                    icon: faceitLoading ? "hourglass" : "link",
                    label: "Привязать FACEIT",
                    iconBg: Color(hex: "#FF5500")
                )
            }
            .buttonStyle(.plain)
            .disabled(faceitLoading)
        } else {
            Button {
                guard let token = auth.token else { return }
                Task {
                    if let result = try? await APIService.shared.unlinkFaceit(token: token),
                       let u = auth.user {
                        auth.updateUser(ClientUser(
                            id: u.id, username: u.username, email: u.email, role: u.role,
                            avatar_url: result["avatar_url"] ?? u.avatar_url,
                            faceit_id: nil, faceit_elo: nil, faceit_level: nil))
                        showToast("FACEIT отвязан")
                    }
                }
            } label: {
                ProfileRow(
                    icon: "link.badge.minus",
                    label: "Отвязать FACEIT",
                    iconBg: Color(hex: "#EF4444").opacity(0.2),
                    labelColor: Color(hex: "#EF4444"),
                    showChevron: false
                )
            }
            .buttonStyle(.plain)
        }
    }

    // MARK: - Helpers

    private var rowDivider: some View {
        Divider()
            .background(Color(hex: "#2F3136"))
            .padding(.leading, 62)
    }

    private func profileGroup(title: String, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 7) {
            Text(title)
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(Color(hex: "#6B7280"))
                .tracking(0.8)
                .padding(.horizontal, 4)

            VStack(spacing: 0) {
                content()
            }
            .background(Color(hex: "#1A1B1F"))
            .cornerRadius(14)
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color(hex: "#2F3136"), lineWidth: 1))
        }
    }

    private func showToast(_ message: String) {
        faceitToast = message
        showFaceitToast = true
        Task {
            try? await Task.sleep(for: .seconds(2.5))
            showFaceitToast = false
        }
    }
}

// MARK: - ProfileRow

struct ProfileRow: View {
    let icon: String
    let label: String
    let iconBg: Color
    var labelColor: Color = .white
    var showChevron: Bool = true

    var body: some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 9)
                    .fill(iconBg)
                    .frame(width: 36, height: 36)
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.white)
            }

            Text(label)
                .font(.system(size: 15))
                .foregroundColor(labelColor)

            Spacer()

            if showChevron {
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(Color(hex: "#a5adba").opacity(0.4))
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 13)
    }
}

// MARK: - FACEIT Stats Grid

struct FaceitStatsGridView: View {
    let stats: FaceitLifetimeStats

    var body: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
            StatCell(label: "Матчи",    value: stats.matches)
            StatCell(label: "Победы",   value: stats.wins)
            StatCell(label: "Винрейт",  value: "\(stats.win_rate)%")
            StatCell(label: "K/D",      value: stats.kd_ratio)
            StatCell(label: "HS%",      value: "\(stats.headshots)%")
            StatCell(label: "Винстрик", value: stats.current_win_streak)
        }
    }
}

struct StatCell: View {
    let label: String
    let value: String

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.system(size: 17, weight: .bold))
                .foregroundColor(.white)
            Text(label)
                .font(.system(size: 10, weight: .medium))
                .foregroundColor(Color(hex: "#6B7280"))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(Color(hex: "#1A1B1F"))
        .cornerRadius(12)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(hex: "#2F3136"), lineWidth: 1))
    }
}

// MARK: - SettingsRow (kept for backward compat)

struct SettingsRow: View {
    let icon: String
    let text: String
    var isDestructive = false
    var iconBg = Color(hex: "#FF7800")

    var body: some View {
        ProfileRow(
            icon: icon,
            label: text,
            iconBg: isDestructive ? Color(hex: "#EF4444") : iconBg,
            labelColor: isDestructive ? Color(hex: "#EF4444") : .white
        )
    }
}
