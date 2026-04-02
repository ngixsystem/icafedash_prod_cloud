import Foundation

struct MyBooking: Codable, Identifiable {
    let id: Int
    let club_name: String
    let zone_name: String
    let duration: String?
    let booking_start_at: String?
    let pc_names: [String]
    let status: String
    let cancellation_reason: String?
    let canceled_by: String?
    let canceled_at: String?
    let chat_url: String?
    let created_at: String?
}
