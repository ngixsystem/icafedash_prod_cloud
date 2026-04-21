import SwiftUI

struct AuthView: View {
    @EnvironmentObject var auth: AuthService
    @State private var isLogin = true
    @State private var username = ""
    @State private var email = ""
    @State private var password = ""
    @State private var verificationCode = ""
    @State private var showVerification = false
    @State private var isLoading = false
    @State private var errorMessage: String?

    // Animation states
    @State private var logoScale: CGFloat = 0.7
    @State private var logoOpacity: Double = 0
    @State private var glowOpacity: Double = 0
    @State private var textOpacity: Double = 0
    @State private var formOffset: CGFloat = 30
    @State private var formOpacity: Double = 0
    @State private var particleOpacity: Double = 0

    private let accent = Color(hex: "#FF7800")

    var body: some View {
        GeometryReader { geo in
            ZStack {
                // ── Full-screen background image ──
                Image("auth-bg")
                    .resizable()
                    .scaledToFill()
                    .frame(width: geo.size.width, height: geo.size.height)
                    .clipped()
                    .ignoresSafeArea()

                // ── Dark overlay so text is readable ──
                Color.black.opacity(0.65)
                    .ignoresSafeArea()

                // ── Content ──
                ScrollView {
                    VStack(spacing: 0) {
                        heroHeader(geo: geo)

                        VStack(spacing: 16) {
                            if showVerification {
                                verificationView
                            } else {
                                authFormView
                            }
                        }
                        .padding(.horizontal, 24)
                        .padding(.top, 32)
                        .offset(y: formOffset)
                        .opacity(formOpacity)
                        .padding(.bottom, 60)
                    }
                }
            }
            .frame(width: geo.size.width, height: geo.size.height)
        }
        .ignoresSafeArea()
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { runAnimations() }
    }

    // MARK: - Hero Header

    private func heroHeader(geo: GeometryProxy) -> some View {
        ZStack {
            // Outer glow ring
            Circle()
                .stroke(
                    RadialGradient(
                        colors: [accent.opacity(0.45), accent.opacity(0)],
                        center: .center,
                        startRadius: 60,
                        endRadius: 160
                    ),
                    lineWidth: 60
                )
                .frame(width: 260, height: 260)
                .opacity(glowOpacity)
                .blur(radius: 20)

            Circle()
                .stroke(accent.opacity(0.18), lineWidth: 1.5)
                .frame(width: 200, height: 200)
                .opacity(glowOpacity)

            Circle()
                .stroke(accent.opacity(0.09), lineWidth: 1)
                .frame(width: 270, height: 270)
                .opacity(glowOpacity)

            // Particles
            ForEach(0..<6, id: \.self) { i in
                Circle()
                    .fill(accent.opacity(0.4))
                    .frame(width: 4, height: 4)
                    .offset(
                        x: CGFloat(cos(Double(i) * .pi / 3)) * 110,
                        y: CGFloat(sin(Double(i) * .pi / 3)) * 110
                    )
                    .opacity(particleOpacity)
            }

            // Logo + text
            VStack(spacing: 14) {
                Image("frag-logo")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 150, height: 150)
                    .scaleEffect(logoScale)
                    .opacity(logoOpacity)
                    .shadow(color: accent.opacity(0.6), radius: 30, x: 0, y: 8)

                VStack(spacing: 4) {
                    Text("FRAG.GG")
                        .font(.system(size: 30, weight: .black))
                        .foregroundColor(.white)
                        .tracking(3)
                        .opacity(textOpacity)

                    Text("Киберспортивный Портал")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(Color(hex: "#c5cdd8"))
                        .tracking(0.5)
                        .opacity(textOpacity)
                }
            }
        }
        .frame(width: geo.size.width, height: 320)
    }

    // MARK: - Auth Form

    var authFormView: some View {
        VStack(spacing: 14) {
            // Custom tab selector (visible on any background)
            HStack(spacing: 0) {
                tabButton(title: "Вход", isActive: isLogin) { isLogin = true }
                tabButton(title: "Регистрация", isActive: !isLogin) { isLogin = false }
            }
            .background(Color.white.opacity(0.1))
            .cornerRadius(12)
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.15), lineWidth: 1))

            TextField("Имя пользователя", text: $username)
                .textFieldStyle(GlassFieldStyle())
                .autocapitalization(.none)
                .textContentType(.username)

            if !isLogin {
                TextField("Email", text: $email)
                    .textFieldStyle(GlassFieldStyle())
                    .autocapitalization(.none)
                    .keyboardType(.emailAddress)
                    .textContentType(.emailAddress)
            }

            SecureField("Пароль", text: $password)
                .textFieldStyle(GlassFieldStyle())
                .textContentType(.password)

            if let error = errorMessage {
                Text(error)
                    .font(.system(size: 13))
                    .foregroundColor(Color(hex: "#FF6B6B"))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 4)
            }

            Button {
                Task { await submitAuth() }
            } label: {
                HStack(spacing: 8) {
                    if isLoading { ProgressView().tint(.white) }
                    Text(isLogin ? "Войти" : "Зарегистрироваться")
                        .font(.system(size: 16, weight: .bold))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 15)
                .background(
                    LinearGradient(
                        colors: [Color(hex: "#FF9000"), accent, Color(hex: "#E06000")],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .foregroundColor(.white)
                .cornerRadius(14)
                .shadow(color: accent.opacity(0.5), radius: 14, y: 5)
            }
            .disabled(isLoading || username.isEmpty || password.isEmpty || (!isLogin && email.isEmpty))
            .opacity((isLoading || username.isEmpty || password.isEmpty) ? 0.65 : 1)
        }
    }

    private func tabButton(title: String, isActive: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(isActive ? .white : Color(hex: "#a5adba"))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 11)
                .background(
                    isActive
                        ? RoundedRectangle(cornerRadius: 10).fill(accent)
                        : RoundedRectangle(cornerRadius: 10).fill(Color.clear)
                )
                .padding(2)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Verification

    var verificationView: some View {
        VStack(spacing: 14) {
            Text("Код отправлен на \(email)")
                .font(.system(size: 14))
                .foregroundColor(Color(hex: "#c5cdd8"))
                .multilineTextAlignment(.center)

            TextField("Код подтверждения", text: $verificationCode)
                .textFieldStyle(GlassFieldStyle())
                .keyboardType(.numberPad)

            if let error = errorMessage {
                Text(error).font(.system(size: 13)).foregroundColor(.red)
            }

            Button {
                Task { await verifyEmail() }
            } label: {
                HStack(spacing: 8) {
                    if isLoading { ProgressView().tint(.white) }
                    Text("Подтвердить").font(.system(size: 16, weight: .bold))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 15)
                .background(accent)
                .foregroundColor(.white)
                .cornerRadius(14)
            }
            .disabled(isLoading || verificationCode.isEmpty)
        }
    }

    // MARK: - Animations

    private func runAnimations() {
        withAnimation(.spring(response: 0.7, dampingFraction: 0.65).delay(0.1)) {
            logoScale = 1.0
            logoOpacity = 1.0
        }
        withAnimation(.easeOut(duration: 0.8).delay(0.2)) {
            glowOpacity = 1.0
        }
        withAnimation(.easeOut(duration: 0.5).delay(0.4)) {
            textOpacity = 1.0
        }
        withAnimation(.easeOut(duration: 0.6).delay(0.5)) {
            particleOpacity = 1.0
        }
        withAnimation(.easeOut(duration: 0.5).delay(0.55)) {
            formOffset = 0
            formOpacity = 1.0
        }
    }

    // MARK: - Logic

    func submitAuth() async {
        isLoading = true
        errorMessage = nil
        do {
            if isLogin {
                let resp = try await APIService.shared.login(username: username, password: password)
                auth.login(token: resp.access_token, user: resp.user)
            } else {
                _ = try await APIService.shared.register(username: username, email: email, password: password)
                showVerification = true
            }
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func verifyEmail() async {
        isLoading = true
        errorMessage = nil
        do {
            let resp = try await APIService.shared.verifyEmail(email: email, code: verificationCode)
            auth.login(token: resp.access_token, user: resp.user)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}

// MARK: - Glass text field style (readable on image background)

struct GlassFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding(14)
            .background(.ultraThinMaterial)
            .cornerRadius(12)
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.2), lineWidth: 1))
            .foregroundColor(.white)
    }
}

// Keep for backwards compat
struct DarkFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding(14)
            .background(.ultraThinMaterial)
            .cornerRadius(12)
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.2), lineWidth: 1))
            .foregroundColor(.white)
    }
}
