import SwiftUI

struct SplashView: View {
    @State private var logoScale: CGFloat = 0.5
    @State private var logoOpacity: Double = 0
    @State private var glowOpacity: Double = 0
    @State private var ringScale: CGFloat = 0.6
    @State private var ringOpacity: Double = 0
    @State private var textOpacity: Double = 0
    @State private var textOffset: CGFloat = 12

    var body: some View {
        ZStack {
            Color(hex: "#0B0D12").ignoresSafeArea()

            // Glow backdrop
            Circle()
                .fill(
                    RadialGradient(
                        colors: [Color(hex: "#FF7800").opacity(0.35), Color.clear],
                        center: .center,
                        startRadius: 0,
                        endRadius: 160
                    )
                )
                .frame(width: 320, height: 320)
                .scaleEffect(ringScale)
                .opacity(glowOpacity)
                .blur(radius: 30)

            // Pulse ring 1
            Circle()
                .stroke(Color(hex: "#FF7800").opacity(0.18), lineWidth: 1.5)
                .frame(width: 220, height: 220)
                .scaleEffect(ringScale)
                .opacity(ringOpacity)

            // Pulse ring 2
            Circle()
                .stroke(Color(hex: "#FF7800").opacity(0.10), lineWidth: 1)
                .frame(width: 280, height: 280)
                .scaleEffect(ringScale * 0.95)
                .opacity(ringOpacity * 0.7)

            VStack(spacing: 20) {
                // Logo
                Image("frag-logo")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 140, height: 140)
                    .scaleEffect(logoScale)
                    .opacity(logoOpacity)

                // App name
                VStack(spacing: 4) {
                    Text("FRAG.GG")
                        .font(.system(size: 26, weight: .black))
                        .foregroundColor(.white)
                        .tracking(4)
                    Text("CLUB FINDER")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(Color(hex: "#a5adba"))
                        .tracking(3)
                }
                .opacity(textOpacity)
                .offset(y: textOffset)
            }
        }
        .onAppear { animate() }
    }

    private func animate() {
        // Logo pop-in
        withAnimation(.spring(response: 0.55, dampingFraction: 0.65)) {
            logoScale = 1.0
            logoOpacity = 1
        }
        // Glow + rings
        withAnimation(.easeOut(duration: 0.6).delay(0.15)) {
            glowOpacity = 1
            ringScale = 1.0
            ringOpacity = 1
        }
        // Text slide-up
        withAnimation(.easeOut(duration: 0.45).delay(0.35)) {
            textOpacity = 1
            textOffset = 0
        }
    }
}
