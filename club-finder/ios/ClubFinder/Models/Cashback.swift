import Foundation

struct CashbackResponse: Codable {
    let cashback_enabled: Bool
    let member_id: Int
    let member_account: String?
    let qr_payload: String
    let total_cashback: Double
    let transactions: [CashbackTransaction]
}

struct CashbackTransaction: Codable, Identifiable {
    let id: Int
    let club_id: Int
    let club_name: String
    let amount: Double
    let cashback_percent: Double
    let cashback_amount: Double
    let note: String
    let created_at: String?
}
