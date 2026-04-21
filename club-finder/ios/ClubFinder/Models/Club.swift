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
    let capacity: AnyCodableValue
    let pcsFree: AnyCodableValue
    let price: String?
    let specs: String?

    var capacityInt: Int {
        switch capacity {
        case .int(let v): return v
        case .double(let v): return Int(v)
        case .string(let v): return Int(v) ?? 0
        }
    }

    var pcsFreeInt: Int {
        switch pcsFree {
        case .int(let v): return v
        case .double(let v): return Int(v)
        case .string(let v): return Int(v) ?? 0
        }
    }
}

struct ZonePCItem: Codable, Identifiable {
    let id: String
    let name: String
    let status: String
    let zone: String
    let member: String?
    let time_left: String?

    var isFree: Bool { status == "free" }
    var isBusy: Bool { status == "busy" }

    enum CodingKeys: String, CodingKey {
        case id, name, status, zone, member, time_left
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        if let intId = try? c.decode(Int.self, forKey: .id) {
            id = "\(intId)"
        } else {
            id = (try? c.decode(String.self, forKey: .id)) ?? UUID().uuidString
        }
        name = try c.decode(String.self, forKey: .name)
        status = try c.decode(String.self, forKey: .status)
        zone = (try? c.decode(String.self, forKey: .zone)) ?? ""
        member = try? c.decode(String.self, forKey: .member)
        time_left = try? c.decode(String.self, forKey: .time_left)
    }
}

struct ZonePCsResponse: Codable {
    let pcs: [ZonePCItem]
    let total: Int
    let free: Int
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

struct ClubReviewsResponse: Codable {
    let reviews: [ClubReview]
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
