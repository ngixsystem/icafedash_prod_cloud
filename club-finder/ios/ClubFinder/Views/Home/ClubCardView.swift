import SwiftUI

struct ClubCardView: View {
    let club: Club
    @ObservedObject private var location = LocationService.shared

    private var availabilityColor: Color {
        if club.pcsFree == 0 { return .red }
        if club.pcsFree <= 10 { return .yellow }
        return .green
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Photo
            if let photo = club.main_photo_url ?? club.photos?.first {
                AsyncImage(url: URL(string: APIService.shared.baseHost + photo)) { image in
                    image.resizable().aspectRatio(contentMode: .fill)
                } placeholder: {
                    Rectangle().fill(Color.white.opacity(0.05))
                }
                .frame(height: 140)
                .clipped()
            }

            VStack(alignment: .leading, spacing: 8) {
                // Name + Logo
                HStack(spacing: 10) {
                    if let logo = club.logo {
                        AsyncImage(url: URL(string: APIService.shared.baseHost + logo)) { image in
                            image.resizable().aspectRatio(contentMode: .fill)
                        } placeholder: {
                            Circle().fill(Color.white.opacity(0.1))
                        }
                        .frame(width: 36, height: 36)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                    }

                    VStack(alignment: .leading, spacing: 2) {
                        Text(club.name)
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.white)

                        Text(club.address)
                            .font(.system(size: 12))
                            .foregroundColor(.gray)
                            .lineLimit(1)
                    }

                    Spacer()

                    // Price
                    if let price = club.pricePerHour {
                        Text("\(Int(price))")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(Color(hex: "#FF7800"))
                        + Text(" сум/ч")
                            .font(.system(size: 10))
                            .foregroundColor(.gray)
                    }
                }

                // Stats row
                HStack(spacing: 16) {
                    // Availability
                    HStack(spacing: 4) {
                        Circle()
                            .fill(availabilityColor)
                            .frame(width: 8, height: 8)
                        Text("\(club.pcsFree)/\(club.pcsTotal)")
                            .font(.system(size: 12))
                            .foregroundColor(.gray)
                    }

                    // Rating
                    HStack(spacing: 3) {
                        Image(systemName: "star.fill")
                            .font(.system(size: 10))
                            .foregroundColor(Color(hex: "#FF7800"))
                        Text(String(format: "%.1f", club.rating))
                            .font(.system(size: 12))
                            .foregroundColor(.gray)
                    }

                    // Distance
                    if let lat = club.lat, let lng = club.lng,
                       let dist = location.formatDistance(to: lat, lng: lng) {
                        HStack(spacing: 3) {
                            Image(systemName: "location")
                                .font(.system(size: 10))
                                .foregroundColor(.gray)
                            Text(dist)
                                .font(.system(size: 12))
                                .foregroundColor(.gray)
                        }
                    }

                    Spacer()

                    // Open/Closed
                    Text(club.isOpen ? "Открыто" : "Закрыто")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(club.isOpen ? .green : .red)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background((club.isOpen ? Color.green : Color.red).opacity(0.15))
                        .cornerRadius(6)
                }
            }
            .padding(12)
        }
        .background(Color.white.opacity(0.06))
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
    }
}
