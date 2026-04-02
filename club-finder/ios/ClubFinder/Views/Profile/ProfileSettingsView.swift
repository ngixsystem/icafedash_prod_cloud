import SwiftUI
import PhotosUI

struct ProfileSettingsView: View {
    @EnvironmentObject var auth: AuthService
    @State private var selectedPhoto: PhotosPickerItem?
    @State private var currentPassword = ""
    @State private var newPassword = ""
    @State private var isUploading = false
    @State private var message: String?

    private let accent = Color(hex: "#FF7800")
    private var isFaceitUser: Bool { auth.user?.faceit_id != nil }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Avatar
                VStack(spacing: 12) {
                    if let avatar = auth.user?.avatar_url, !avatar.isEmpty {
                        AsyncImage(url: URL(string: avatar.hasPrefix("http") ? avatar : APIService.shared.baseHost + avatar)) { image in
                            image.resizable().aspectRatio(contentMode: .fill)
                        } placeholder: {
                            Circle().fill(Color.white.opacity(0.1))
                        }
                        .frame(width: 80, height: 80)
                        .clipShape(Circle())
                    }

                    PhotosPicker(selection: $selectedPhoto, matching: .images) {
                        Text("Изменить аватар")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(accent)
                    }
                }
                .padding(.top, 8)

                // Password change
                VStack(alignment: .leading, spacing: 12) {
                    Text(isFaceitUser ? "Установить пароль" : "Изменить пароль")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.white)

                    if !isFaceitUser {
                        SecureField("Текущий пароль", text: $currentPassword)
                            .textFieldStyle(DarkFieldStyle())
                    }

                    SecureField("Новый пароль", text: $newPassword)
                        .textFieldStyle(DarkFieldStyle())

                    if let msg = message {
                        Text(msg)
                            .font(.system(size: 13))
                            .foregroundColor(msg.contains("успешно") ? .green : .red)
                    }

                    Button {
                        Task { await changePassword() }
                    } label: {
                        Text("Сохранить")
                            .font(.system(size: 15, weight: .semibold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(accent)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                    }
                    .disabled(newPassword.count < 4)
                }
            }
            .padding(.horizontal)
        }
        .background(Color(hex: "#121315"))
        .navigationTitle("Настройки")
        .navigationBarTitleDisplayMode(.inline)
        .onChange(of: selectedPhoto) { _, item in
            Task {
                guard let item, let data = try? await item.loadTransferable(type: Data.self),
                      let token = auth.token else { return }
                isUploading = true
                _ = try? await APIService.shared.uploadAvatar(data: data, token: token)
                isUploading = false
            }
        }
    }

    func changePassword() async {
        guard let token = auth.token else { return }
        do {
            if isFaceitUser {
                _ = try await APIService.shared.setPassword(password: newPassword, token: token)
            } else {
                _ = try await APIService.shared.changePassword(current: currentPassword, new: newPassword, token: token)
            }
            message = "Пароль успешно изменён"
            currentPassword = ""
            newPassword = ""
        } catch {
            message = error.localizedDescription
        }
    }
}
