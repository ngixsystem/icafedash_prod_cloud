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

    private let accent = Color(hex: "#FF7800")

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Logo
                Image("frag-logo")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 100, height: 100)
                    .padding(.top, 40)

                if showVerification {
                    verificationView
                } else {
                    authFormView
                }
            }
            .padding(.horizontal, 24)
        }
        .background(Color(hex: "#121315"))
        .navigationTitle(isLogin ? "Вход" : "Регистрация")
        .navigationBarTitleDisplayMode(.inline)
    }

    var authFormView: some View {
        VStack(spacing: 14) {
            // Tab picker
            Picker("", selection: $isLogin) {
                Text("Вход").tag(true)
                Text("Регистрация").tag(false)
            }
            .pickerStyle(.segmented)

            TextField("Имя пользователя", text: $username)
                .textFieldStyle(DarkFieldStyle())
                .autocapitalization(.none)
                .textContentType(.username)

            if !isLogin {
                TextField("Email", text: $email)
                    .textFieldStyle(DarkFieldStyle())
                    .autocapitalization(.none)
                    .keyboardType(.emailAddress)
                    .textContentType(.emailAddress)
            }

            SecureField("Пароль", text: $password)
                .textFieldStyle(DarkFieldStyle())
                .textContentType(.password)

            if let error = errorMessage {
                Text(error)
                    .font(.system(size: 13))
                    .foregroundColor(.red)
            }

            Button {
                Task { await submitAuth() }
            } label: {
                HStack {
                    if isLoading {
                        ProgressView().tint(.white)
                    }
                    Text(isLogin ? "Войти" : "Зарегистрироваться")
                        .font(.system(size: 16, weight: .semibold))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(accent)
                .foregroundColor(.white)
                .cornerRadius(14)
            }
            .disabled(isLoading || username.isEmpty || password.isEmpty || (!isLogin && email.isEmpty))
        }
    }

    var verificationView: some View {
        VStack(spacing: 14) {
            Text("Код отправлен на \(email)")
                .font(.system(size: 14))
                .foregroundColor(.gray)

            TextField("Код подтверждения", text: $verificationCode)
                .textFieldStyle(DarkFieldStyle())
                .keyboardType(.numberPad)

            if let error = errorMessage {
                Text(error)
                    .font(.system(size: 13))
                    .foregroundColor(.red)
            }

            Button {
                Task { await verifyEmail() }
            } label: {
                HStack {
                    if isLoading { ProgressView().tint(.white) }
                    Text("Подтвердить")
                        .font(.system(size: 16, weight: .semibold))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(accent)
                .foregroundColor(.white)
                .cornerRadius(14)
            }
            .disabled(isLoading || verificationCode.isEmpty)
        }
    }

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

struct DarkFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding(14)
            .background(Color.white.opacity(0.06))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.white.opacity(0.1), lineWidth: 1)
            )
            .foregroundColor(.white)
    }
}
