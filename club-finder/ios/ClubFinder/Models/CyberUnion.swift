import Foundation

struct CyberUnionTeam: Codable, Identifiable {
    let id: Int
    let name: String
    let points: Int
    let photo: String
    let region: String
    let region_photo: String
}

struct CyberUnionPlayer: Codable, Identifiable {
    let id: Int
    let name: String
    let nickname: String
    let points: Int
    let photo: String
    let team: String?
    let region: String
    let region_photo: String
}

struct CyberUnionTeamPlayer: Codable, Identifiable {
    let id: Int
    let name: String
    let nickname: String
    let points: Int
    let photo: String
}

struct CyberUnionTeamsResponse: Codable {
    let items: [CyberUnionTeam]
    let total: Int
    let page: Int
    let page_count: Int
}

struct CyberUnionPlayersResponse: Codable {
    let items: [CyberUnionPlayer]
    let total: Int
    let page: Int
    let page_count: Int
}
