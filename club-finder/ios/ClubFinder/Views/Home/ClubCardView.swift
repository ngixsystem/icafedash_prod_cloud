import SwiftUI

struct ClubCardView: View {
    let club: Club
    @ObservedObject private var location = LocationService.shared

    private var capacityFraction: Double {
        guard club.pcsTotal > 0 else { return 0 }
        return Double(club.pcsFree) / Double(club.pcsTotal)
    }

    private var capacityColor: Color {
        if capacityFraction > 0.5 { return Color(hex: "#57F287") }
        if capacityFraction > 0.2 { return Color(hex: "#FEE75C") }
        return Color(hex: "#ED4245")
    }

    private var photoPlaceholder: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: "#1a1b1f"), Color(hex: "#12131a")],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            Image(systemName: "photo")
                .font(.system(size: 36))
                .foregroundColor(Color(hex: "#2F3136"))
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Photo
            ZStack(alignment: .bottomLeading) {
                let rawPhoto = club.main_photo_url ?? club.logo ?? club.photos?.first
                let photo = rawPhoto.flatMap { $0.isEmpty ? nil : $0 }
                if let photo {
                    AsyncImage(url: photo.hasPrefix("http") ? URL(string: photo) : URL(string: APIService.shared.baseHost + photo)) { phase in
                        switch phase {
                        case .success(let image):
                            image.resizable().aspectRatio(contentMode: .fill)
                        default:
                            photoPlaceholder
                        }
                    }
                    .frame(height: 200)
                    .clipped()
                } else {
                    photoPlaceholder
                        .frame(height: 200)
                }
                // gradient overlay for readability
                LinearGradient(
                    colors: [Color.clear, Color(hex: "#0B0D12").opacity(0.7)],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .frame(height: 200)

                // Open/Closed badge over photo
                HStack(spacing: 4) {
                    Circle()
                        .fill(club.isOpen ? Color(hex: "#57F287") : Color(hex: "#ED4245"))
                        .frame(width: 7, height: 7)
                    Text(club.isOpen ? "Открыто" : "Закрыто")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(club.isOpen ? Color(hex: "#57F287") : Color(hex: "#ED4245"))
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(.ultraThinMaterial)
                .cornerRadius(6)
                .padding(10)
            }

            VStack(alignment: .leading, spacing: 8) {
                // Name row
                HStack(spacing: 8) {
                    Text(club.name)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.white)
                        .lineLimit(1)

                    Spacer()
                }

                // Address
                HStack(spacing: 4) {
                    Image(systemName: "location.fill")
                        .font(.system(size: 10))
                        .foregroundColor(Color(hex: "#a5adba"))
                    Text(club.address)
                        .font(.system(size: 12))
                        .foregroundColor(Color(hex: "#a5adba"))
                        .lineLimit(1)
                }

                // Capacity bar
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text("\(club.pcsFree) свободно")
                            .font(.system(size: 11))
                            .foregroundColor(Color(hex: "#a5adba"))
                        Spacer()
                        Text("\(club.pcsTotal) всего")
                            .font(.system(size: 11))
                            .foregroundColor(Color(hex: "#a5adba"))
                    }
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 2)
                                .fill(Color(hex: "#272727"))
                                .frame(height: 4)
                            RoundedRectangle(cornerRadius: 2)
                                .fill(capacityColor)
                                .frame(width: geo.size.width * capacityFraction, height: 4)
                        }
                    }
                    .frame(height: 4)
                }

                // Bottom row: rating + distance + price
                HStack(spacing: 12) {
                    HStack(spacing: 3) {
                        Image(systemName: "star.fill")
                            .font(.system(size: 10))
                            .foregroundColor(Color(hex: "#FF7800"))
                        Text(String(format: "%.1f", club.rating))
                            .font(.system(size: 12))
                            .foregroundColor(Color(hex: "#a5adba"))
                    }

                    if let lat = club.lat, let lng = club.lng,
                       let dist = location.formatDistance(to: lat, lng: lng) {
                        HStack(spacing: 3) {
                            Image(systemName: "location")
                                .font(.system(size: 10))
                                .foregroundColor(Color(hex: "#a5adba"))
                            Text(dist)
                                .font(.system(size: 12))
                                .foregroundColor(Color(hex: "#a5adba"))
                        }
                    }

                    Spacer()

                    if let price = club.pricePerHour {
                        Text("\(Int(price)) сум/ч")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(Color(hex: "#FF7800"))
                    }
                }
            }
            .padding(12)
        }
        .background(Color(hex: "#1E1F22"))
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color(hex: "#2F3136"), lineWidth: 1)
        )
    }
}
