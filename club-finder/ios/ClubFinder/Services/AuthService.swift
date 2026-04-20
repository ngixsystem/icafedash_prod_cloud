import Foundation
import SwiftUI
import AuthenticationServices
import CryptoKit

// MARK: - FACEIT OAuth helper

private final class FaceitWindowProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first(where: \.isKeyWindow) ?? UIWindow()
    }
}

private func makeCodeVerifier() -> String {
    var bytes = [UInt8](repeating: 0, count: 32)
    _ = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
    return Data(bytes).base64EncodedString()
        .replacingOccurrences(of: "+", with: "-")
        .replacingOccurrences(of: "/", with: "_")
        .replacingOccurrences(of: "=", with: "")
}

private func makeCodeChallenge(verifier: String) -> String {
    let data = Data(verifier.utf8)
    let hash = SHA256.hash(data: data)
    return Data(hash).base64EncodedString()
        .replacingOccurrences(of: "+", with: "-")
        .replacingOccurrences(of: "/", with: "_")
        .replacingOccurrences(of: "=", with: "")
}

// MARK: - AuthService

class AuthService: ObservableObject {
    static let shared = AuthService()

    @Published var user: ClientUser?
    @Published var token: String?
    @Published var isLoggedIn = false

    private let tokenKey = "icafe_client_token"
    private let userKey  = "icafe_client_user"

    private let faceitClientID  = "38961025-aebd-41f7-8424-86879eb9f6af"
    private let faceitRedirect  = "https://cloud.icafedash.com/api/auth/faceit/oauth-callback"
    private var faceitWindowProvider = FaceitWindowProvider()
    private var activeAuthSession: ASWebAuthenticationSession?

    init() { loadFromStorage() }

    // MARK: Login / Logout

    func login(token: String, user: ClientUser) {
        self.token = token
        self.user  = user
        self.isLoggedIn = true
        saveToStorage()
    }

    func logout() {
        self.token = nil
        self.user  = nil
        self.isLoggedIn = false
        UserDefaults.standard.removeObject(forKey: tokenKey)
        UserDefaults.standard.removeObject(forKey: userKey)
    }

    func updateUser(_ user: ClientUser) {
        self.user = user
        saveToStorage()
    }

    // MARK: FACEIT OAuth

    @MainActor
    func linkFaceit(token: String) async throws {
        let verifier  = makeCodeVerifier()
        let challenge = makeCodeChallenge(verifier: verifier)

        // Build state JSON: {v, link_token, source}
        let stateDict: [String: String] = ["v": verifier, "link_token": token, "source": "ios"]
        let stateData = try JSONEncoder().encode(stateDict)
        let state = stateData.base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")

        var comps = URLComponents(string: "https://accounts.faceit.com/accounts")!
        comps.queryItems = [
            URLQueryItem(name: "client_id",              value: faceitClientID),
            URLQueryItem(name: "redirect_uri",           value: faceitRedirect),
            URLQueryItem(name: "response_type",          value: "code"),
            URLQueryItem(name: "scope",                  value: "openid email membership"),
            URLQueryItem(name: "state",                  value: state),
            URLQueryItem(name: "code_challenge",         value: challenge),
            URLQueryItem(name: "code_challenge_method",  value: "S256"),
        ]
        guard let url = comps.url else { throw APIError.invalidURL }

        let callbackURL: URL = try await withCheckedThrowingContinuation { cont in
            let session = ASWebAuthenticationSession(url: url, callbackURLScheme: "fraggg") { url, error in
                self.activeAuthSession = nil
                if let error = error {
                    cont.resume(throwing: error)
                } else if let url = url {
                    cont.resume(returning: url)
                } else {
                    cont.resume(throwing: APIError.serverError("Нет callback URL"))
                }
            }
            session.presentationContextProvider = self.faceitWindowProvider
            session.prefersEphemeralWebBrowserSession = false
            self.activeAuthSession = session
            session.start()
        }

        // Parse callback params
        let cbComps = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false)
        let params  = Dictionary(
            uniqueKeysWithValues: (cbComps?.queryItems ?? []).compactMap { item -> (String, String)? in
                guard let v = item.value else { return nil }
                return (item.name, v)
            }
        )

        if let err = params["faceit_error"] {
            throw APIError.serverError(err.replacingOccurrences(of: "_", with: " "))
        }
        guard let faceitId = params["faceit_id"] else {
            throw APIError.serverError("Нет faceit_id в ответе")
        }

        guard let current = self.user else { return }
        let updated = ClientUser(
            id:           current.id,
            username:     current.username,
            email:        current.email,
            role:         current.role,
            avatar_url:   params["avatar_url"] ?? current.avatar_url,
            faceit_id:    faceitId,
            faceit_elo:   params["faceit_elo"].flatMap(Int.init),
            faceit_level: params["faceit_level"].flatMap(Int.init)
        )
        self.updateUser(updated)
    }

    // MARK: Storage

    private func saveToStorage() {
        UserDefaults.standard.set(token, forKey: tokenKey)
        if let user, let data = try? JSONEncoder().encode(user) {
            UserDefaults.standard.set(data, forKey: userKey)
        }
    }

    private func loadFromStorage() {
        token = UserDefaults.standard.string(forKey: tokenKey)
        if let data = UserDefaults.standard.data(forKey: userKey),
           let user = try? JSONDecoder().decode(ClientUser.self, from: data) {
            self.user = user
            self.isLoggedIn = token != nil
        }
    }
}
