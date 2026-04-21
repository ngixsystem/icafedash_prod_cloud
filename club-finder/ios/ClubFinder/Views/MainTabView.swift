import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var auth: AuthService
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                HomeView()
            }
            .background(.clear)
            .tabItem {
                Image(systemName: "house")
                Text("Клубы")
            }
            .tag(0)

            NavigationStack {
                MapScreenView()
            }
            .background(.clear)
            .tabItem {
                Image(systemName: "map")
                Text("Карта")
            }
            .tag(1)

            NavigationStack {
                TournamentsView()
            }
            .background(.clear)
            .tabItem {
                Image(systemName: "trophy")
                Text("Турниры")
            }
            .tag(2)

            NavigationStack {
                RatingsHubView()
            }
            .background(.clear)
            .tabItem {
                Image(systemName: "chart.bar.xaxis")
                Text("Рейтинги")
            }
            .tag(3)

            NavigationStack {
                if auth.isLoggedIn {
                    ProfileView()
                } else {
                    AuthView()
                }
            }
            .background(.clear)
            .tabItem {
                Image(systemName: "person")
                Text("Профиль")
            }
            .tag(4)
        }
        .tint(Color(hex: "#FF7800"))
        .background {
            Image("auth-bg")
                .resizable()
                .scaledToFill()
                .ignoresSafeArea()
            Color.black.opacity(0.78)
                .ignoresSafeArea()
        }
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        let scanner = Scanner(string: hex)
        var rgbValue: UInt64 = 0
        scanner.scanHexInt64(&rgbValue)
        let r = Double((rgbValue & 0xFF0000) >> 16) / 255.0
        let g = Double((rgbValue & 0x00FF00) >> 8) / 255.0
        let b = Double(rgbValue & 0x0000FF) / 255.0
        self.init(red: r, green: g, blue: b)
    }
}

extension Font {
    // Rajdhani — основной UI шрифт (body, labels, stats)
    static func raj(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        let name: String
        switch weight {
        case .bold, .heavy, .black:  name = "Rajdhani-Bold"
        case .semibold:              name = "Rajdhani-SemiBold"
        case .medium:                name = "Rajdhani-Medium"
        default:                     name = "Rajdhani-Regular"
        }
        return .custom(name, size: size)
    }
}
