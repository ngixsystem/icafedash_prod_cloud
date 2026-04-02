import Foundation

struct FaceitStatsPayload: Codable {
    let lifetime: FaceitLifetimeStats
    let maps: [FaceitMapStats]
}

struct FaceitLifetimeStats: Codable {
    let matches: String
    let wins: String
    let win_rate: String
    let kd_ratio: String
    let headshots: String
    let longest_win_streak: String
    let current_win_streak: String
}

struct FaceitMapStats: Codable, Identifiable {
    var id: String { name }
    let name: String
    let img_regular: String
    let matches: String
    let wins: String
    let win_rate: String
    let avg_kills: String
    let avg_deaths: String
    let avg_kd: String
    let avg_headshots: String
}

struct FaceitHistoryPayload: Codable {
    let matches: [FaceitMatch]
}

struct FaceitMatch: Codable, Identifiable {
    let match_id: String
    let map: String?
    let started_at: Int?
    let finished_at: Int?
    let is_win: Bool?
    let score: String
    let team_name: String
    let opponent_name: String
    let stats: FaceitMatchPlayerStats?

    var id: String { match_id }
}

struct FaceitMatchPlayerStats: Codable {
    let kills: String?
    let deaths: String?
    let assists: String?
    let kd_ratio: String?
    let headshots: String?
}

struct FaceitRankingPlayer: Codable, Identifiable {
    var id: String { player_id }
    let player_id: String
    let nickname: String
    let avatar: String
    let country: String
    let faceit_elo: Int
    let skill_level: Int
    let position: Int
}
