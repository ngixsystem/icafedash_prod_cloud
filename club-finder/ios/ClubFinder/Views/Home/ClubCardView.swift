import SwiftUI

struct ClubCardView: View {
    let club: Club
    @ObservedObject private var location = LocationService.shared

    private let accent = Color(hex: "#FF7800")

    private var distanceText: String {
        guard let lat = club.lat, let lng = club.lng else { return "-" }
        return location.formatDistance(to: lat, lng: lng) ?? "-"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            photoSection
            infoSection
        }
        .background(Color(hex: "#16171C"))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.white.opacity(0.07), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.35), radius: 10, y: 4)
    }

    // MARK: - Photo section (top part with overlays)

    private var photoSection: some View {
        GeometryReader { geo in
            ZStack {
                // Background photo
                let rawPhoto = club.main_photo_url ?? club.logo ?? club.photos?.first
                let photo = rawPhoto.flatMap { $0.isEmpty ? nil : $0 }

                if let photo {
                    AsyncImage(url: photo.hasPrefix("http")
                               ? URL(string: photo)
                               : URL(string: APIService.shared.baseHost + photo)) { phase in
                        switch phase {
                        case .success(let image):
                            image.resizable().scaledToFill()
                                .frame(width: geo.size.width, height: 200)
                                .clipped()
                        default:
                            photoPlaceholder(width: geo.size.width)
                        }
                    }
                } else {
                    photoPlaceholder(width: geo.size.width)
                }

                // Bottom gradient
                LinearGradient(
                    colors: [Color(hex: "#16171C"), Color(hex: "#16171C").opacity(0.4), .clear],
                    startPoint: .bottom, endPoint: .top
                )
                .frame(width: geo.size.width, height: 200)

                // Club logo watermark (center, large, faded)
                if let logo = club.logo, !logo.isEmpty {
                    AsyncImage(url: logo.hasPrefix("http")
                               ? URL(string: logo)
                               : URL(string: APIService.shared.baseHost + logo)) { phase in
                        if case .success(let img) = phase {
                            img.resizable().scaledToFit()
                                .frame(width: 110, height: 110)
                                .opacity(0.18)
                        }
                    }
                }

                // Overlaid content
                VStack {
                    // Top row: open/close badge + rating
                    HStack {
                        openBadge
                        Spacer()
                        ratingBadge
                    }
                    .padding(.horizontal, 12)
                    .padding(.top, 10)

                    Spacer()

                    // Club name at bottom
                    HStack {
                        Text(club.name.uppercased())
                            .font(.bebas(28))
                            .foregroundColor(.white)
                            .shadow(color: .black.opacity(0.6), radius: 4, y: 2)
                            .lineLimit(1)
                        Spacer()
                    }
                    .padding(.horizontal, 12)
                    .padding(.bottom, 10)
                }
                .frame(width: geo.size.width, height: 200)
            }
        }
        .frame(height: 200)
    }

    // MARK: - Info section (bottom part)

    private var infoSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Address
            HStack(spacing: 5) {
                Image(systemName: "mappin.circle.fill")
                    .font(.system(size: 12))
                    .foregroundColor(accent)
                Text(club.address)
                    .font(.raj(14, weight: .medium))
                    .foregroundColor(Color(hex: "#a5adba"))
                    .lineLimit(1)
            }
            .padding(.horizontal, 12)
            .padding(.top, 12)
            .padding(.bottom, 10)

            // Orange separator line
            Rectangle()
                .fill(accent)
                .frame(height: 2)
                .padding(.horizontal, 12)

            // Bottom stats row
            HStack(spacing: 0) {
                // PC availability
                HStack(spacing: 8) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color(hex: "#1E1F22"))
                            .frame(width: 36, height: 36)
                        Image(systemName: "desktopcomputer")
                            .font(.system(size: 16))
                            .foregroundColor(accent)
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text("СВОБОДНО")
                            .font(.raj(10, weight: .semibold))
                            .foregroundColor(Color(hex: "#5c6068"))
                            .tracking(0.5)
                        Text("\(club.pcsFree) / \(club.pcsTotal) ПК")
                            .font(.bebas(16))
                            .foregroundColor(.white)
                    }
                }

                Spacer()

                // Distance
                VStack(alignment: .trailing, spacing: 1) {
                    Text("РАССТОЯНИЕ")
                        .font(.raj(10, weight: .semibold))
                        .foregroundColor(Color(hex: "#5c6068"))
                        .tracking(0.5)
                    Text(distanceText)
                        .font(.bebas(16))
                        .foregroundColor(.white)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 12)
        }
    }

    // MARK: - Badges

    private var openBadge: some View {
        HStack(spacing: 5) {
            Circle()
                .fill(club.isOpen ? Color(hex: "#57F287") : Color(hex: "#ED4245"))
                .frame(width: 6, height: 6)
            Text(club.isOpen ? "ОТКРЫТО" : "ЗАКРЫТО")
                .font(.raj(12, weight: .bold))
                .foregroundColor(club.isOpen ? Color(hex: "#57F287") : Color(hex: "#ED4245"))
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(.ultraThinMaterial)
        .clipShape(Capsule())
    }

    private var ratingBadge: some View {
        HStack(spacing: 4) {
            Image(systemName: "star.fill")
                .font(.system(size: 10))
                .foregroundColor(Color(hex: "#FEE75C"))
            Text(String(format: "%.1f", club.rating))
                .font(.raj(14, weight: .bold))
                .foregroundColor(.white)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(.ultraThinMaterial)
        .clipShape(Capsule())
    }

    // MARK: - Placeholder

    private func photoPlaceholder(width: CGFloat) -> some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: "#1a1b22"), Color(hex: "#0f1018")],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
            Image(systemName: "photo")
                .font(.system(size: 40))
                .foregroundColor(Color(hex: "#2F3136"))
        }
        .frame(width: width, height: 200)
    }
}
