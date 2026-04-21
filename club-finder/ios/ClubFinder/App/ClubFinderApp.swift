import SwiftUI

@main
struct ClubFinderApp: App {
    @StateObject private var auth = AuthService.shared
    @State private var showSplash = true

    init() {
        // Transparent tab bar so global background shows through
        let tabApp = UITabBarAppearance()
        tabApp.configureWithTransparentBackground()
        UITabBar.appearance().standardAppearance = tabApp
        UITabBar.appearance().scrollEdgeAppearance = tabApp

        // Transparent navigation bar
        let navApp = UINavigationBarAppearance()
        navApp.configureWithTransparentBackground()
        navApp.titleTextAttributes = [.foregroundColor: UIColor.white]
        navApp.largeTitleTextAttributes = [.foregroundColor: UIColor.white]
        UINavigationBar.appearance().standardAppearance = navApp
        UINavigationBar.appearance().scrollEdgeAppearance = navApp
    }

    var body: some Scene {
        WindowGroup {
            ZStack {
                MainTabView()
                    .environmentObject(auth)
                    .preferredColorScheme(.dark)

                if showSplash {
                    SplashView()
                        .transition(.opacity)
                        .zIndex(1)
                }
            }
            .preferredColorScheme(.dark)
            .task {
                try? await Task.sleep(nanoseconds: 2_000_000_000)
                withAnimation(.easeOut(duration: 0.5)) {
                    showSplash = false
                }
            }
        }
    }
}
