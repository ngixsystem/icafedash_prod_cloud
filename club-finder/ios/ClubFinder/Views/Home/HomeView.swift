import SwiftUI

private struct FallbackBanner: Identifiable {
    let id: Int
    let title: String
    let subtitle: String
    let imageName: String
}

private let fallbackBanners: [FallbackBanner] = [
    FallbackBanner(id: 1, title: "Турнирный сезон",  subtitle: "CS2 / Dota 2 / Valorant",        imageName: "club1"),
    FallbackBanner(id: 2, title: "Ночные скидки",    subtitle: "Пакеты до -25% после 23:00",      imageName: "club2"),
    FallbackBanner(id: 3, title: "VIP-зоны",         subtitle: "Комфортные кабины для сквадов",   imageName: "club3"),
]

struct HomeView: View {
    @ObservedObject private var location = LocationService.shared
    @State private var clubs: [Club] = []
    @State private var banners: [Banner] = []
    @State private var searchText = ""
    @State private var isLoading = true
    @State private var currentBanner = 0

    private let accent = Color(hex: "#FF7800")

    var filteredClubs: [Club] {
        let filtered = searchText.isEmpty ? clubs : clubs.filter {
            $0.name.localizedCaseInsensitiveContains(searchText) ||
            $0.address.localizedCaseInsensitiveContains(searchText)
        }
        return filtered.sorted { a, b in
            guard let aLat = a.lat, let aLng = a.lng,
                  let bLat = b.lat, let bLng = b.lng else { return false }
            let aDist = location.distanceKm(to: aLat, lng: aLng) ?? .infinity
            let bDist = location.distanceKm(to: bLat, lng: bLng) ?? .infinity
            return aDist < bDist
        }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                // Banner carousel
                bannerCarousel
                    .padding(.top, 4)

                // Search
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    TextField("Поиск клуба...", text: $searchText)
                        .foregroundColor(.white)
                }
                .padding(12)
                .background(Color.white.opacity(0.08))
                .cornerRadius(14)
                .padding(.horizontal)

                if isLoading {
                    ProgressView()
                        .tint(accent)
                        .padding(.top, 40)
                } else if filteredClubs.isEmpty {
                    Text("Клубы не найдены")
                        .foregroundColor(.gray)
                        .padding(.top, 40)
                } else {
                    LazyVStack(spacing: 12) {
                        ForEach(filteredClubs) { club in
                            NavigationLink(destination: ClubDetailView(clubId: club.id)) {
                                ClubCardView(club: club)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal)
                }
            }
            .padding(.top, 8)
        }
        .background(Color(hex: "#121315"))
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) {
                if UIImage(named: "frag-logo") != nil {
                    Image("frag-logo")
                        .resizable()
                        .scaledToFit()
                        .frame(height: 28)
                } else {
                    Text("FRAG.GG")
                        .font(.system(size: 18, weight: .black))
                        .foregroundColor(accent)
                }
            }
        }
        .task {
            location.requestPermission()
            async let clubsTask: () = loadClubs()
            async let bannersTask: () = loadBanners()
            await clubsTask
            await bannersTask
        }
        .refreshable {
            await loadClubs()
            await loadBanners()
        }
    }

    private var bannerCarousel: some View {
        TabView(selection: $currentBanner) {
            if banners.isEmpty {
                ForEach(fallbackBanners) { b in
                    fallbackSlide(b).tag(b.id)
                }
            } else {
                ForEach(banners) { banner in
                    apiBannerSlide(banner).tag(banner.id)
                }
            }
        }
        .tabViewStyle(.page(indexDisplayMode: .automatic))
        .frame(height: 180)
        .cornerRadius(16)
        .padding(.horizontal)
    }

    private func fallbackSlide(_ b: FallbackBanner) -> some View {
        ZStack(alignment: .bottomLeading) {
            Image(b.imageName)
                .resizable()
                .scaledToFill()
                .frame(maxWidth: .infinity)
                .clipped()
            LinearGradient(
                gradient: Gradient(colors: [.black.opacity(0.7), .clear]),
                startPoint: .bottom,
                endPoint: .center
            )
            VStack(alignment: .leading, spacing: 2) {
                Text(b.title)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(.white)
                Text(b.subtitle)
                    .font(.system(size: 12))
                    .foregroundColor(.white.opacity(0.8))
            }
            .padding(14)
        }
        .cornerRadius(16)
    }

    private func apiBannerSlide(_ banner: Banner) -> some View {
        let imageURL: URL? = banner.image_url.hasPrefix("http")
            ? URL(string: banner.image_url)
            : URL(string: APIService.shared.baseHost + banner.image_url)
        return ZStack(alignment: .bottomLeading) {
            AsyncImage(url: imageURL) { image in
                image.resizable().scaledToFill()
            } placeholder: {
                Rectangle().fill(Color.white.opacity(0.05))
            }
            .frame(maxWidth: .infinity)
            .clipped()
            LinearGradient(
                gradient: Gradient(colors: [.black.opacity(0.7), .clear]),
                startPoint: .bottom,
                endPoint: .center
            )
            VStack(alignment: .leading, spacing: 2) {
                Text(banner.title)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(.white)
                Text(banner.subtitle)
                    .font(.system(size: 12))
                    .foregroundColor(.white.opacity(0.8))
            }
            .padding(14)
        }
        .cornerRadius(16)
    }

    func loadClubs() async {
        do {
            clubs = try await APIService.shared.getClubs()
        } catch {
            print("Error loading clubs: \(error)")
        }
        isLoading = false
    }

    func loadBanners() async {
        banners = (try? await APIService.shared.getBanners()) ?? []
    }
}
