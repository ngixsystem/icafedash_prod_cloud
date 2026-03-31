import SwiftUI
import AuthenticationServices

struct ProfileView: View {
    @EnvironmentObject var auth: AuthService
    @State private var faceitStats: FaceitStatsPayload?
    @State private var faceitHistory: [FaceitMatch] = []
    @State private var selectedTab = 0
    @State private var showSettings = false
    @State private var faceitLoading = false
    @State private var faceitToast: String?
    @State private var showFaceitToast = false

    private let accent = Color(hex: "#FF7800")

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Avatar + Info
                VStack(spacing: 12) {
                    if let avatar = auth.user?.avatar_url, !avatar.isEmpty {
                        AsyncImage(url: URL(string: avatar.hasPrefix("http") ? avatar : APIService.shared.baseURL.replacingOccurrences(of: "/api", with: "") + avatar)) { image in
                            image.resizable().aspectRatio(contentMode: .fill)
                        } placeholder: {
                            Circle().fill(Color.white.opacity(0.1))
                        }
                        .frame(width: 80, height: 80)
                        .clipShape(Circle())
                        .overlay(Circle().stroke(accent, lineWidth: 2))
                    } else {
                        Image(systemName: "person.circle.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                    }

                    Text(auth.user?.username ?? "")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(.white)

                    if let level = auth.user?.faceit_level, let elo = auth.user?.faceit_elo {
                        FaceitLevelBadge(level: level, elo: elo)
                    }
                }
                .padding(.top, 8)

                // FACEIT Stats
                if let stats = faceitStats {
                    Picker("", selection: $selectedTab) {
                        Text("Статистика").tag(0)
                        Text("История").tag(1)
                    }
                    .pickerStyle(.segmented)

                    if selectedTab == 0 {
                        FaceitStatsGridView(stats: stats.lifetime)

                        if !stats.maps.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Карты")
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundColor(.white)

                                ForEach(stats.maps) { map in
                                    HStack {
                                        Text(map.name)
                                            .font(.system(size: 14, weight: .semibold))
                                            .foregroundColor(.white)
                                        Spacer()
                                        Text("WR: \(map.win_rate)%")
                                            .font(.system(size: 12))
                                            .foregroundColor(.gray)
                                        Text("K/D: \(map.avg_kd)")
                                            .font(.system(size: 12))
                                            .foregroundColor(.gray)
                                        Text("\(map.matches) игр")
                                            .font(.system(size: 12))
                                            .foregroundColor(.gray)
                                    }
                                    .padding(10)
                                    .background(Color.white.opacity(0.05))
                                    .cornerRadius(10)
                                }
                            }
                        }
                    } else {
                        ForEach(faceitHistory) { match in
                            HStack(spacing: 10) {
                                Circle()
                                    .fill(match.is_win == true ? Color.green : Color.red)
                                    .frame(width: 8, height: 8)

                                VStack(alignment: .leading, spacing: 2) {
                                    Text("\(match.team_name) vs \(match.opponent_name)")
                                        .font(.system(size: 13, weight: .semibold))
                                        .foregroundColor(.white)
                                    HStack(spacing: 8) {
                                        Text(match.map ?? "")
                                            .font(.system(size: 11))
                                            .foregroundColor(.gray)
                                        Text(match.score)
                                            .font(.system(size: 11))
                                            .foregroundColor(.gray)
                                    }
                                }

                                Spacer()

                                if let stats = match.stats {
                                    VStack(alignment: .trailing, spacing: 2) {
                                        Text("K/D: \(stats.kd_ratio ?? "-")")
                                            .font(.system(size: 11))
                                            .foregroundColor(.gray)
                                        Text("\(stats.kills ?? "0")/\(stats.deaths ?? "0")/\(stats.assists ?? "0")")
                                            .font(.system(size: 11))
                                            .foregroundColor(.gray)
                                    }
                                }
                            }
                            .padding(10)
                            .background(Color.white.opacity(0.05))
                            .cornerRadius(10)
                        }
                    }
                }

                // FACEIT
                faceitSection

                // Actions
                VStack(spacing: 8) {
                    NavigationLink(destination: ProfileSettingsView()) {
                        SettingsRow(icon: "gearshape", text: "Настройки")
                    }

                    NavigationLink(destination: CashbackView()) {
                        SettingsRow(icon: "creditcard", text: "Кэшбэк")
                    }

                    NavigationLink(destination: BookingView()) {
                        SettingsRow(icon: "calendar", text: "Мои бронирования")
                    }

                    Button {
                        auth.logout()
                    } label: {
                        SettingsRow(icon: "rectangle.portrait.and.arrow.right", text: "Выйти", isDestructive: true)
                    }
                }
            }
            .padding(.horizontal)
        }
        .background(Color(hex: "#121315"))
        .overlay(alignment: .bottom) {
            if showFaceitToast, let msg = faceitToast {
                Text(msg)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(Color(hex: "#1E1E2E").opacity(0.95))
                    .cornerRadius(20)
                    .padding(.bottom, 90)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                    .animation(.easeInOut(duration: 0.3), value: showFaceitToast)
            }
        }
        .navigationTitle("Профиль")
        .navigationBarTitleDisplayMode(.large)
        .task {
            guard let token = auth.token, auth.user?.faceit_id != nil else { return }
            faceitStats = try? await APIService.shared.getFaceitStats(token: token)
            faceitHistory = (try? await APIService.shared.getFaceitHistory(token: token))?.matches ?? []
        }
    }

    @ViewBuilder
    private var faceitSection: some View {
        if auth.user?.faceit_id == nil {
            Button {
                guard let token = auth.token else { return }
                faceitLoading = true
                Task {
                    do {
                        try await auth.linkFaceit(token: token)
                        showToast("FACEIT успешно привязан!")
                    } catch let error as ASWebAuthenticationSessionError
                          where error.code == .canceledLogin {
                        showToast("Авторизация отменена")
                    } catch {
                        showToast(error.localizedDescription)
                    }
                    faceitLoading = false
                }
            } label: {
                HStack(spacing: 12) {
                    if faceitLoading {
                        ProgressView().tint(.white).frame(width: 24)
                    } else {
                        Image(systemName: "link")
                            .font(.system(size: 16))
                            .foregroundColor(Color(hex: "#FF7800"))
                            .frame(width: 24)
                    }
                    Text("Привязать FACEIT")
                        .font(.system(size: 15))
                        .foregroundColor(.white)
                    Spacer()
                }
                .padding(14)
                .background(Color.white.opacity(0.05))
                .cornerRadius(12)
            }
            .disabled(faceitLoading)
        } else {
            Button {
                guard let token = auth.token else { return }
                Task {
                    if let result = try? await APIService.shared.unlinkFaceit(token: token) {
                        let u = auth.user!
                        auth.updateUser(ClientUser(
                            id: u.id, username: u.username, email: u.email,
                            role: u.role,
                            avatar_url: result["avatar_url"] ?? u.avatar_url,
                            faceit_id: nil, faceit_elo: nil, faceit_level: nil
                        ))
                        showToast("FACEIT отвязан")
                    }
                }
            } label: {
                HStack(spacing: 12) {
                    Image(systemName: "link.badge.minus")
                        .font(.system(size: 16))
                        .foregroundColor(.red)
                        .frame(width: 24)
                    Text("Отвязать FACEIT")
                        .font(.system(size: 15))
                        .foregroundColor(.red)
                    Spacer()
                }
                .padding(14)
                .background(Color.white.opacity(0.05))
                .cornerRadius(12)
            }
        }
    }

    private func showToast(_ message: String) {
        faceitToast = message
        showFaceitToast = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
            showFaceitToast = false
        }
    }
}

struct FaceitStatsGridView: View {
    let stats: FaceitLifetimeStats

    var body: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
            StatCell(label: "Матчи", value: stats.matches)
            StatCell(label: "Победы", value: stats.wins)
            StatCell(label: "Винрейт", value: "\(stats.win_rate)%")
            StatCell(label: "K/D", value: stats.kd_ratio)
            StatCell(label: "HS%", value: "\(stats.headshots)%")
            StatCell(label: "Винстрик", value: stats.current_win_streak)
        }
    }
}

struct StatCell: View {
    let label: String
    let value: String

    var body: some View {
        VStack(spacing: 3) {
            Text(value)
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(.white)
            Text(label)
                .font(.system(size: 10))
                .foregroundColor(.gray)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(Color.white.opacity(0.05))
        .cornerRadius(10)
    }
}

struct SettingsRow: View {
    let icon: String
    let text: String
    var isDestructive = false

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundColor(isDestructive ? .red : .gray)
                .frame(width: 24)
            Text(text)
                .font(.system(size: 15))
                .foregroundColor(isDestructive ? .red : .white)
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: 12))
                .foregroundColor(.gray.opacity(0.5))
        }
        .padding(14)
        .background(Color.white.opacity(0.05))
        .cornerRadius(12)
    }
}
