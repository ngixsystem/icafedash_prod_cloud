import Foundation

struct PublicTournament: Codable, Identifiable {
    let id: Int
    let title: String
    let game: String
    let description: String
    let team_format: String
    let location: String
    let starts_at: String?
    let check_in_at: String?
    let status: String
    let format: String
    let max_teams: Int
    let prize_pool: String
    let entry_fee: String
    let stream_url: String
    let faceit_championship_id: String
    let region: String
    let logo_url: String
    let banner_url: String?
    let registered_teams: Int
}

struct TournamentDetails: Codable {
    let tournament: PublicTournament
    let registrations: [TournamentRegistration]
}

struct TournamentRegistration: Codable, Identifiable {
    let id: Int
    let team_id: Int
    let team_name: String
    let team_tag: String?
    let team_logo_url: String
    let status: String
    let members: [TournamentMember]
}

struct TournamentMember: Codable, Identifiable {
    let id: Int
    let username: String
    let avatar_url: String
    let role_in_team: String
    let faceit_id: String?
    let faceit_elo: Int?
    let faceit_level: Int?
}

struct GameRatingPlayer: Identifiable, Decodable {
    let id: Int
    let username: String
    let avatar_url: String?
    let score: Int
    let rank: Int
}

struct FaceitBracketResponse: Codable {
    let matches: [FaceitBracketMatch]
}

struct FaceitBracketMatch: Codable, Identifiable {
    let id: String
    let round: Int
    let match_number: Int
    let team1_name: String?
    let team2_name: String?
    let team1_score: Int?
    let team2_score: Int?
    let winner: String?
    let status: String
    let faceit_match_id: String?
}
