import SwiftUI

@main
struct ClubFinderApp: App {
    @StateObject private var auth = AuthService.shared

    var body: some Scene {
        WindowGroup {
            MainTabView()
                .environmentObject(auth)
                .preferredColorScheme(.dark)
        }
    }
}
