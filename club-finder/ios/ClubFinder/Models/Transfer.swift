import Foundation

struct TransferListing: Codable, Identifiable {
    let id: Int
    let listing_type: String
    let game: String
    let roles: String?
    let description: String?
    let region: String?
    let min_elo: Int?
    let max_elo: Int?
    let contact: String?
    let created_at: String
    let expires_at: String?
    let player: TransferPlayer
}

struct TransferPlayer: Codable, Identifiable {
    let id: Int
    let username: String
    let avatar_url: String
    let faceit_elo: Int?
    let faceit_level: Int?
    let team_name: String?
}

struct TransferListResponse: Codable {
    let items: [TransferListing]
    let total: Int
}

struct PlayerProfile: Codable, Identifiable {
    let id: Int
    let username: String
    let avatar_url: String?
    let faceit_id: String?
    let faceit_elo: Int?
    let faceit_level: Int?
    let team: PlayerTeam?
    let tournament_history: [PlayerTournamentHistory]?
    let transfer_listing: TransferListing?
}

struct PlayerTeam: Codable {
    let id: Int
    let name: String
    let tag: String?
    let logo_url: String?
}

struct PlayerTournamentHistory: Codable, Identifiable {
    let id: Int
    let title: String
    let game: String
    let team_name: String
    let placement: String?
}
