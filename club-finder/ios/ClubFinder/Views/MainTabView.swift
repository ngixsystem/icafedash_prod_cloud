import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var auth: AuthService
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                HomeView()
            }
            .tabItem {
                Image(systemName: "magnifyingglass")
                Text("Клубы")
            }
            .tag(0)

            NavigationStack {
                MapScreenView()
            }
            .tabItem {
                Image(systemName: "map")
                Text("Карта")
            }
            .tag(1)

            NavigationStack {
                TournamentsView()
            }
            .tabItem {
                Image(systemName: "trophy")
                Text("Турниры")
            }
            .tag(2)

            NavigationStack {
                TransferView()
            }
            .tabItem {
                Image(systemName: "arrow.left.arrow.right")
                Text("Трансфер")
            }
            .tag(3)

            NavigationStack {
                if auth.isLoggedIn {
                    ProfileView()
                } else {
                    AuthView()
                }
            }
            .tabItem {
                Image(systemName: "person")
                Text("Профиль")
            }
            .tag(4)
        }
        .tint(Color(hex: "#FF7800"))
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
