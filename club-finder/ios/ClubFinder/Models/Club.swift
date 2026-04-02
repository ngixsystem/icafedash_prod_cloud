import Foundation

struct Club: Codable, Identifiable {
    let id: Int
    let name: String
    let logo: String?
    let pcsTotal: Int
    let pcsFree: Int
    let rating: Double
    let address: String
    let description: String?
    let working_hours: String?
    let lat: Double?
    let lng: Double?
    let isOpen: Bool
    let pricePerHour: Double?
    let zones: [Zone]?
    let tariffs: [Tariff]?
    let rating_count: Int?
    let main_photo_url: String?
    let photos: [String]?

    enum CodingKeys: String, CodingKey {
        case id, name, logo, address, description, working_hours, lat, lng, isOpen, zones, tariffs, photos
        case pcsTotal = "pcsTotal"
        case pcsFree = "pcsFree"
        case rating, rating_count
        case pricePerHour = "pricePerHour"
        case main_photo_url = "main_photo_url"
    }
}

struct Zone: Codable, Identifiable {
    var id: String { name }
    let name: String
    let capacity: String
    let pcsFree: String
    let price: String?
    let specs: String?
}

struct Tariff: Codable, Identifiable {
    var id: String { duration }
    let duration: String
    let price: AnyCodableValue

    var priceString: String {
        switch price {
        case .int(let v): return "\(v) сум"
        case .double(let v): return "\(Int(v)) сум"
        case .string(let v): return v
        }
    }
}

enum AnyCodableValue: Codable {
    case int(Int)
    case double(Double)
    case string(String)

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let v = try? container.decode(Int.self) { self = .int(v); return }
        if let v = try? container.decode(Double.self) { self = .double(v); return }
        if let v = try? container.decode(String.self) { self = .string(v); return }
        throw DecodingError.typeMismatch(AnyCodableValue.self, .init(codingPath: decoder.codingPath, debugDescription: "Cannot decode"))
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .int(let v): try container.encode(v)
        case .double(let v): try container.encode(v)
        case .string(let v): try container.encode(v)
        }
    }
}

struct ClubReview: Codable, Identifiable {
    let id: Int
    let user_id: Int
    let username: String
    let rating: Int
    let text: String
    let created_at: String?
}

struct ZonePC: Codable, Identifiable {
    let id: Int
    let name: String
    let status: String
}
