import SwiftUI

@main
struct ClubFinderApp: App {
    @StateObject private var auth = AuthService.shared
    @State private var showSplash = true

    init() {
        let darkBg = UIColor(red: 0.04, green: 0.05, blue: 0.07, alpha: 1)

        // Dark opaque tab bar
        let tabApp = UITabBarAppearance()
        tabApp.configureWithOpaqueBackground()
        tabApp.backgroundColor = UIColor(red: 0.06, green: 0.07, blue: 0.09, alpha: 0.97)
        UITabBar.appearance().standardAppearance = tabApp
        UITabBar.appearance().scrollEdgeAppearance = tabApp

        // Dark opaque navigation bar
        let navApp = UINavigationBarAppearance()
        navApp.configureWithOpaqueBackground()
        navApp.backgroundColor = darkBg
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
