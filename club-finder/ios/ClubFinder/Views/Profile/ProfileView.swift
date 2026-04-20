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
    @State private var logoScale: CGFloat = 0.6
    @State private var logoOpacity: Double = 0
    @State private var glowOpacity: Double = 0
    @State private var sloganOffset: CGFloat = 10
    @State private var sloganOpacity: Double = 0

    private let accent = Color(hex: "#FF7800")

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Hero header
                ZStack {
                    // Background gradient
                    LinearGradient(
                        colors: [Color(hex: "#0B0D12"), Color(hex: "#13141A"), Color(hex: "#0B0D12")],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )

                    // Orange glow behind logo
                    RadialGradient(
                        colors: [accent.opacity(0.35), accent.opacity(0.08), Color.clear],
                        center: .init(x: 0.5, y: 0.42),
                        startRadius: 0,
                        endRadius: 160
                    )
                    .opacity(glowOpacity)

                    // Decorative ring
                    Circle()
                        .stroke(accent.opacity(0.12), lineWidth: 1)
                        .frame(width: 200, height: 200)
                        .offset(y: -10)
                        .opacity(glowOpacity)

                    VStack(spacing: 10) {
                        Image("frag-logo")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 88, height: 88)
                            .scaleEffect(logoScale)
                            .opacity(logoOpacity)

                        VStack(spacing: 4) {
                            Text("FRAG.GG")
                                .font(.system(size: 22, weight: .black))
                                .foregroundColor(.white)
                                .tracking(2)
                                .opacity(sloganOpacity)
                                .offset(y: sloganOffset)

                            Text("Киберспортивный Портал")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(Color(hex: "#a5adba"))
                                .tracking(0.5)
                                .opacity(sloganOpacity)
                                .offset(y: sloganOffset)
                        }
                    }
                    .padding(.vertical, 36)
                }
                .frame(maxWidth: .infinity)

                // Avatar + username
                VStack(spacing: 12) {
                    if let avatar = auth.user?.avatar_url, !avatar.isEmpty {
                        AsyncImage(url: URL(string: avatar.hasPrefix("http") ? avatar : APIService.shared.baseHost + avatar)) { image in
                            image.resizable().aspectRatio(contentMode: .fill)
                        } placeholder: {
                            Circle().fill(Color.white.opacity(0.1))
                        }
                        .frame(width: 80, height: 80)
                        .clipShape(Circle())
                        .overlay(Circle().stroke(accent, lineWidth: 2))
                        .overlay(
                            Circle()
                                .stroke(accent.opacity(0.3), lineWidth: 6)
                        )
                        .shadow(color: accent.opacity(0.4), radius: 12)
                    } else {
                        ZStack {
                            Circle()
                                .fill(LinearGradient(
                                    colors: [Color(hex: "#1E1F22"), Color(hex: "#2a2b30")],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ))
                                .frame(width: 80, height: 80)
                                .overlay(Circle().stroke(accent.opacity(0.5), lineWidth: 2))
                                .shadow(color: accent.opacity(0.25), radius: 10)
                            Image(systemName: "person.fill")
                                .font(.system(size: 36))
                                .foregroundColor(Color(hex: "#a5adba"))
                        }
                    }

                    Text(auth.user?.username ?? "")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(.white)

                    if let level = auth.user?.faceit_level, let elo = auth.user?.faceit_elo {
                        FaceitLevelBadge(level: level, elo: elo)
                    }
                }
                .padding(.top, 20)
                .padding(.bottom, 16)
                .padding(.horizontal)

                VStack(spacing: 16) {
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

                    // FACEIT link/unlink
                    faceitSection

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
                }
                .padding(.horizontal)
                .padding(.bottom, 24)
            }
        }
        .background(Color(hex: "#0B0D12"))
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
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            withAnimation(.spring(response: 0.6, dampingFraction: 0.7).delay(0.1)) {
                logoScale = 1.0
                logoOpacity = 1.0
                glowOpacity = 1.0
            }
            withAnimation(.easeOut(duration: 0.5).delay(0.35)) {
                sloganOpacity = 1.0
                sloganOffset = 0
            }
        }
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
                    if let result = try? await APIService.shared.unlinkFaceit(token: token),
                           let u = auth.user {
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
        Task {
            try? await Task.sleep(for: .seconds(2.5))
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
