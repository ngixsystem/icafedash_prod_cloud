import Foundation

struct ClientUser: Codable, Identifiable {
    let id: Int
    let username: String
    let email: String
    let role: String
    let avatar_url: String?
    let faceit_id: String?
    let faceit_elo: Int?
    let faceit_level: Int?
}

struct AuthResponse: Codable {
    let access_token: String
    let user: ClientUser
}

struct VerifyResponse: Codable {
    let access_token: String
    let user: ClientUser
}
