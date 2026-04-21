import SwiftUI

private struct FallbackBanner: Identifiable {
    let id: Int
    let title: String
    let subtitle: String
    let imageName: String
}

private let fallbackBanners: [FallbackBanner] = [
    FallbackBanner(id: 1, title: "Турнирный сезон",  subtitle: "CS2 / Dota 2 / Valorant",      imageName: "club1"),
    FallbackBanner(id: 2, title: "Ночные скидки",    subtitle: "Пакеты до -25% после 23:00",    imageName: "club2"),
    FallbackBanner(id: 3, title: "VIP-зоны",         subtitle: "Комфортные кабины для сквадов", imageName: "club3"),
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
            VStack(spacing: 0) {
                // Search bar
                searchBar
                    .padding(.horizontal, 16)
                    .padding(.top, 12)
                    .padding(.bottom, 14)

                // Banner carousel
                bannerCarousel
                    .padding(.horizontal, 16)

                // Section header
                sectionHeader("ПОПУЛЯРНЫЕ ЛОКАЦИИ")
                    .padding(.horizontal, 16)
                    .padding(.top, 20)
                    .padding(.bottom, 12)

                // Club list
                if isLoading {
                    ProgressView().tint(accent).padding(.top, 40)
                } else if filteredClubs.isEmpty {
                    Text("Клубы не найдены")
                        .foregroundColor(.gray)
                        .padding(.top, 40)
                } else {
                    LazyVStack(spacing: 16) {
                        ForEach(filteredClubs) { club in
                            NavigationLink(value: club.id) {
                                ClubCardView(club: club)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, 16)
                    .navigationDestination(for: Int.self) { clubId in
                        ClubDetailView(clubId: clubId)
                    }
                }

                Spacer().frame(height: 24)
            }
        }
        .background(.clear)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { toolbarContent }
        .task {
            location.requestPermission()
            async let c: () = loadClubs()
            async let b: () = loadBanners()
            await c; await b
        }
        .refreshable {
            await loadClubs()
            await loadBanners()
        }
    }

    // MARK: - Toolbar

    @ToolbarContentBuilder
    private var toolbarContent: some ToolbarContent {
        ToolbarItem(placement: .topBarLeading) {
            HStack(spacing: 10) {
                Image("frag-logo")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 40, height: 40)

                VStack(alignment: .leading, spacing: 1) {
                    Text("FRAG.GG")
                        .font(.bebas(20))
                        .foregroundColor(.white)
                        .tracking(1)
                    Text("КИБЕРСПОРТИВНЫЙ ПОРТАЛ")
                        .font(.system(size: 9, weight: .semibold))
                        .foregroundColor(Color(hex: "#FF7800"))
                        .tracking(0.5)
                }
            }
        }
    }

    // MARK: - Search bar

    private var searchBar: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 15, weight: .medium))
                .foregroundColor(Color(hex: "#5c6068"))
            TextField("Поиск по названию или адресу...", text: $searchText)
                .font(.raj(15, weight: .medium))
                .foregroundColor(.white)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 13)
        .background(Color(hex: "#16171C"))
        .cornerRadius(12)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(hex: "#2F3136"), lineWidth: 1))
    }

    // MARK: - Section header

    private func sectionHeader(_ title: String) -> some View {
        HStack(spacing: 8) {
            RoundedRectangle(cornerRadius: 2)
                .fill(Color(hex: "#FF7800"))
                .frame(width: 4, height: 18)
            Text(title)
                .font(.bebas(20))
                .foregroundColor(.white)
                .tracking(1)
            Spacer()
        }
    }

    // MARK: - Banner carousel

    private var bannerCarousel: some View {
        GeometryReader { geo in
            TabView(selection: $currentBanner) {
                if banners.isEmpty {
                    ForEach(fallbackBanners) { b in
                        fallbackSlide(b, width: geo.size.width).tag(b.id)
                    }
                } else {
                    ForEach(banners) { banner in
                        apiBannerSlide(banner, width: geo.size.width)
                            .tag(banner.id)
                            .onTapGesture {
                                if let link = banner.link_url, !link.isEmpty,
                                   let url = URL(string: link) {
                                    UIApplication.shared.open(url)
                                }
                            }
                    }
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .automatic))
            .frame(width: geo.size.width, height: 190)
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .frame(height: 190)
    }

    private func fallbackSlide(_ b: FallbackBanner, width: CGFloat) -> some View {
        ZStack(alignment: .bottomLeading) {
            Image(b.imageName)
                .resizable()
                .scaledToFill()
                .frame(width: width, height: 190)
                .clipped()
            LinearGradient(
                colors: [.black.opacity(0.75), .clear],
                startPoint: .bottom, endPoint: .center
            )
            .frame(width: width, height: 190)
            VStack(alignment: .leading, spacing: 2) {
                Text(b.title.uppercased())
                    .font(.bebas(24))
                    .foregroundColor(.white)
                Text(b.subtitle)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.white.opacity(0.75))
            }
            .padding(16)
        }
    }

    private func apiBannerSlide(_ banner: Banner, width: CGFloat) -> some View {
        let imageURL: URL? = banner.image_url.hasPrefix("http")
            ? URL(string: banner.image_url)
            : URL(string: APIService.shared.baseHost + banner.image_url)
        return ZStack(alignment: .bottomLeading) {
            AsyncImage(url: imageURL) { phase in
                switch phase {
                case .success(let image):
                    image.resizable().scaledToFill()
                        .frame(width: width, height: 190).clipped()
                default:
                    LinearGradient(
                        colors: [Color(hex: "#1a1b1f"), Color(hex: "#12131a")],
                        startPoint: .topLeading, endPoint: .bottomTrailing
                    )
                    .frame(width: width, height: 190)
                }
            }
            LinearGradient(
                colors: [.black.opacity(0.75), .clear],
                startPoint: .bottom, endPoint: .center
            )
            .frame(width: width, height: 190)
            VStack(alignment: .leading, spacing: 2) {
                Text(banner.title.uppercased())
                    .font(.bebas(24))
                    .foregroundColor(.white)
                Text(banner.subtitle)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.white.opacity(0.75))
            }
            .padding(16)
        }
    }

    func loadClubs() async {
        do { clubs = try await APIService.shared.getClubs() }
        catch { print("Error loading clubs: \(error)") }
        isLoading = false
    }

    func loadBanners() async {
        banners = (try? await APIService.shared.getBanners()) ?? []
    }
}
