import Foundation

struct CyberUnionTeam: Codable, Identifiable {
    let id: Int
    let team_name: String
    let logo_url: String?
    let score: Int
    let rank: Int
}

struct CyberUnionPlayer: Codable, Identifiable {
    let id: Int
    let username: String
    let avatar_url: String?
    let faceit_elo: Int?
    let faceit_level: Int?
    let score: Int
    let rank: Int
    let team_name: String?
}

struct CyberUnionTeamPlayer: Codable, Identifiable {
    let id: Int
    let username: String
    let avatar_url: String?
    let faceit_elo: Int?
    let faceit_level: Int?
}

struct CyberUnionTeamsResponse: Codable {
    let items: [CyberUnionTeam]
    let total: Int
}

struct CyberUnionPlayersResponse: Codable {
    let items: [CyberUnionPlayer]
    let total: Int
}
