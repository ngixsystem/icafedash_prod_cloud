import SwiftUI
import WebKit

struct StreamPlayerView: UIViewRepresentable {
    let embedURL: URL

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.scrollView.isScrollEnabled = false
        webView.backgroundColor = .black
        webView.isOpaque = false
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        webView.load(URLRequest(url: embedURL))
    }
}

// Converts any stream URL into an embeddable URL
func streamEmbedURL(from rawURL: String) -> URL? {
    guard let url = URL(string: rawURL) else { return nil }
    let host = url.host?.lowercased() ?? ""

    // Twitch: https://www.twitch.tv/channelname
    if host.contains("twitch.tv") {
        let channel = url.pathComponents.last(where: { $0 != "/" }) ?? ""
        if !channel.isEmpty {
            return URL(string: "https://player.twitch.tv/?channel=\(channel)&parent=localhost&autoplay=false")
        }
    }

    // YouTube watch: https://www.youtube.com/watch?v=ID
    if host.contains("youtube.com"), let vi = URLComponents(url: url, resolvingAgainstBaseURL: false)?
        .queryItems?.first(where: { $0.name == "v" })?.value {
        return URL(string: "https://www.youtube.com/embed/\(vi)?playsinline=1")
    }

    // YouTube short: https://youtu.be/ID
    if host.contains("youtu.be") {
        let vid = url.lastPathComponent
        return URL(string: "https://www.youtube.com/embed/\(vid)?playsinline=1")
    }

    // Fallback — load as-is
    return url
}
