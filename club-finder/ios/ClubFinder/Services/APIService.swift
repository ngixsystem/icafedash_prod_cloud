import Foundation

enum APIError: LocalizedError {
    case invalidURL
    case unauthorized
    case serverError(String)
    case decodingError(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Неверный URL"
        case .unauthorized: return "Необходима авторизация"
        case .serverError(let msg): return msg
        case .decodingError(let err): return err.localizedDescription
        }
    }
}

class APIService {
    static let shared = APIService()

    let baseURL = "https://cloud.icafedash.com/api"

    /// Base URL без "/api" — для построения URL загрузок (фото, логотипы)
    var baseHost: String { baseURL.hasSuffix("/api") ? String(baseURL.dropLast(4)) : baseURL }

    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        return d
    }()

    private func request<T: Decodable>(_ path: String, method: String = "GET", body: Data? = nil, token: String? = nil, queryItems: [URLQueryItem]? = nil) async throws -> T {
        guard var components = URLComponents(string: "\(baseURL)\(path)") else {
            throw APIError.invalidURL
        }
        if let queryItems { components.queryItems = queryItems }
        guard let url = components.url else { throw APIError.invalidURL }

        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token { req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        req.httpBody = body

        let (data, response) = try await URLSession.shared.data(for: req)

        if let http = response as? HTTPURLResponse {
            if http.statusCode == 401 { throw APIError.unauthorized }
            if http.statusCode >= 400 {
                let msg = (try? JSONDecoder().decode([String: String].self, from: data))?["message"] ?? "Ошибка сервера"
                throw APIError.serverError(msg)
            }
        }

        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }
    }

    private func upload<T: Decodable>(_ path: String, fileData: Data, fileName: String, mimeType: String, token: String) async throws -> T {
        guard let url = URL(string: "\(baseURL)\(path)") else { throw APIError.invalidURL }

        let boundary = UUID().uuidString
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        var body = Data()
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(fileName)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        body.append(fileData)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
        req.httpBody = body

        let (data, response) = try await URLSession.shared.data(for: req)
        if let http = response as? HTTPURLResponse, http.statusCode >= 400 {
            let msg = (try? JSONDecoder().decode([String: String].self, from: data))?["message"] ?? "Ошибка загрузки"
            throw APIError.serverError(msg)
        }
        return try decoder.decode(T.self, from: data)
    }

    // MARK: - Clubs
    func getClubs() async throws -> [Club] {
        try await request("/public/clubs")
    }

    func getClub(id: Int) async throws -> Club {
        try await request("/public/clubs/\(id)")
    }

    func getClubReviews(id: Int) async throws -> [ClubReview] {
        try await request("/public/clubs/\(id)/reviews")
    }

    func submitReview(clubId: Int, rating: Int, text: String, token: String) async throws -> [String: String] {
        let body = try JSONEncoder().encode(["rating": "\(rating)", "text": text])
        return try await request("/public/clubs/\(clubId)/reviews", method: "POST", body: body, token: token)
    }

    func getZonePCs(clubId: Int, zoneName: String) async throws -> [ZonePC] {
        try await request("/public/clubs/\(clubId)/zone-pcs", queryItems: [.init(name: "zone_name", value: zoneName)])
    }

    // MARK: - Banners
    func getBanners() async throws -> [Banner] {
        try await request("/public/banners")
    }

    // MARK: - Auth
    func login(username: String, password: String) async throws -> AuthResponse {
        let body = try JSONEncoder().encode(["username": username, "password": password])
        return try await request("/clients/login", method: "POST", body: body)
    }

    func register(username: String, email: String, password: String) async throws -> [String: String] {
        let body = try JSONEncoder().encode(["username": username, "email": email, "password": password])
        return try await request("/clients/register", method: "POST", body: body)
    }

    func verifyEmail(email: String, code: String) async throws -> VerifyResponse {
        let body = try JSONEncoder().encode(["email": email, "code": code])
        return try await request("/auth/verify-email", method: "POST", body: body)
    }

    // MARK: - Profile
    func uploadAvatar(data: Data, token: String) async throws -> [String: String] {
        try await upload("/public/profile/avatar", fileData: data, fileName: "avatar.jpg", mimeType: "image/jpeg", token: token)
    }

    func changePassword(current: String, new: String, token: String) async throws -> [String: String] {
        let body = try JSONEncoder().encode(["current_password": current, "new_password": new])
        return try await request("/public/profile/password", method: "PUT", body: body, token: token)
    }

    func setPassword(password: String, token: String) async throws -> [String: String] {
        let body = try JSONEncoder().encode(["password": password])
        return try await request("/public/profile/set-password", method: "POST", body: body, token: token)
    }

    // MARK: - FACEIT Stats
    func getFaceitStats(token: String) async throws -> FaceitStatsPayload {
        try await request("/public/profile/faceit/stats", token: token)
    }

    func getFaceitHistory(token: String, limit: Int = 20) async throws -> FaceitHistoryPayload {
        try await request("/public/profile/faceit/history", token: token, queryItems: [.init(name: "limit", value: "\(limit)")])
    }

    func unlinkFaceit(token: String) async throws -> [String: String] {
        try await request("/public/profile/faceit", method: "DELETE", token: token)
    }

    // MARK: - Bookings
    func getMyBookings(token: String) async throws -> [MyBooking] {
        try await request("/public/bookings/my", token: token)
    }

    func createBooking(clubId: Int, zoneName: String, duration: String, pcNames: [String], token: String) async throws -> [String: String] {
        let params: [String: Any] = ["zone_name": zoneName, "duration": duration, "pc_names": pcNames]
        let body = try JSONSerialization.data(withJSONObject: params)
        return try await request("/public/clubs/\(clubId)/bookings", method: "POST", body: body, token: token)
    }

    func cancelBooking(id: Int, reason: String, token: String) async throws -> [String: String] {
        let body = try JSONEncoder().encode(["reason": reason])
        return try await request("/public/bookings/\(id)/cancel", method: "PUT", body: body, token: token)
    }

    // MARK: - Tournaments
    func getTournaments() async throws -> [PublicTournament] {
        try await request("/public/tournaments")
    }

    func getTournamentDetails(id: Int) async throws -> TournamentDetails {
        try await request("/public/tournaments/\(id)")
    }

    func getFaceitBracket(tournamentId: Int) async throws -> FaceitBracketResponse {
        try await request("/public/tournaments/\(tournamentId)/faceit-bracket")
    }

    func getTournamentGameRating(id: Int, game: String) async throws -> [GameRatingPlayer] {
        try await request("/public/tournaments/\(id)/game-rating",
                          queryItems: [URLQueryItem(name: "game", value: game)])
    }

    // MARK: - Transfer Market
    func getTransferListings(game: String? = nil, type: String? = nil, region: String? = nil, limit: Int = 20, offset: Int = 0) async throws -> TransferListResponse {
        var items: [URLQueryItem] = [
            .init(name: "limit", value: "\(limit)"),
            .init(name: "offset", value: "\(offset)")
        ]
        if let game { items.append(.init(name: "game", value: game)) }
        if let type { items.append(.init(name: "type", value: type)) }
        if let region { items.append(.init(name: "region", value: region)) }
        return try await request("/public/transfer", queryItems: items)
    }

    func createTransferListing(params: [String: Any], token: String) async throws -> [String: String] {
        let body = try JSONSerialization.data(withJSONObject: params)
        return try await request("/public/transfer", method: "POST", body: body, token: token)
    }

    func deleteTransferListing(id: Int, token: String) async throws -> [String: String] {
        try await request("/public/transfer/\(id)", method: "DELETE", token: token)
    }

    // MARK: - Player
    func getPlayerProfile(id: Int) async throws -> PlayerProfile {
        try await request("/public/players/\(id)")
    }

    func getPlayerFaceitStats(id: Int) async throws -> FaceitStatsPayload {
        try await request("/public/players/\(id)/faceit-stats")
    }

    // MARK: - Rankings
    func getFaceitRankings(limit: Int = 100) async throws -> [FaceitRankingPlayer] {
        let response: FaceitRankingsResponse = try await request("/public/faceit/rankings/uzbekistan", queryItems: [.init(name: "limit", value: "\(limit)")])
        return response.items
    }

    // MARK: - CYBER UNION
    func getCyberUnionTeams(game: String, page: Int, perPage: Int = 20) async throws -> CyberUnionTeamsResponse {
        try await request("/public/cyberunion/teams", queryItems: [
            .init(name: "game", value: game),
            .init(name: "page", value: "\(page)"),
            .init(name: "per_page", value: "\(perPage)")
        ])
    }

    func getCyberUnionPlayers(game: String, page: Int, perPage: Int = 20) async throws -> CyberUnionPlayersResponse {
        try await request("/public/cyberunion/players", queryItems: [
            .init(name: "game", value: game),
            .init(name: "page", value: "\(page)"),
            .init(name: "per_page", value: "\(perPage)")
        ])
    }

    func getCyberUnionTeamPlayers(game: String, teamName: String) async throws -> [CyberUnionTeamPlayer] {
        let resp: CyberUnionTeamPlayersResponse = try await request("/public/cyberunion/team-players", queryItems: [
            .init(name: "game", value: game),
            .init(name: "team_name", value: teamName)
        ])
        return resp.items
    }

    // MARK: - Cashback
    func getCashback(token: String) async throws -> CashbackResponse {
        try await request("/public/cashback/me", token: token)
    }
}
