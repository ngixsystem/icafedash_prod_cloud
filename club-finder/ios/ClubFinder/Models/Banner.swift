import Foundation

struct Banner: Identifiable, Decodable {
    let id: Int
    let title: String
    let subtitle: String
    let image_url: String
    let link_url: String?
}
