# iOS ClubFinder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Добавить 4 недостающих фичи в существующий iOS ClubFinder (`club-finder/ios/ClubFinder/`): баннер-карусель, FRAG.GG логотип, FACEIT OAuth через ASWebAuthenticationSession, экран TournamentGameRating.

**Architecture:** Точечный патч поверх ~2947 строк существующего Swift кода. Не трогаем рабочие экраны — только добавляем новые файлы и расширяем существующие. Backend получает минимальное изменение для поддержки iOS redirect.

**Tech Stack:** Swift 5.9+, SwiftUI, async/await, CryptoKit (PKCE), AuthenticationServices (ASWebAuthenticationSession), iOS 15+

---

### Task 1: Banner модель

**Files:**
- Create: `club-finder/ios/ClubFinder/Models/Banner.swift`

- [x] **Создать файл модели**

```swift
import Foundation

struct Banner: Identifiable, Decodable {
    let id: Int
    let title: String
    let subtitle: String
    let image_url: String
    let link_url: String?
}
```

- [x] **Commit**

```bash
git add club-finder/ios/ClubFinder/Models/Banner.swift
git commit -m "feat(ios): add Banner model"
```

---

### Task 2: APIService — getBanners()

**Files:**
- Modify: `club-finder/ios/ClubFinder/Services/APIService.swift`

- [x] **Добавить метод в конец MARK: Clubs секции (после `getZonePCs`)**

Открой `APIService.swift`, найди строку:
```swift
    // MARK: - Auth
```
Вставь перед ней:
```swift
    // MARK: - Banners
    func getBanners() async throws -> [Banner] {
        try await request("/public/banners")
    }
```

- [x] **Commit**

```bash
git add club-finder/ios/ClubFinder/Services/APIService.swift
git commit -m "feat(ios): add getBanners() to APIService"
```

---

### Task 3: Добавить fallback изображения в Assets.xcassets

**Files:**
- Modify: `club-finder/ios/ClubFinder/Assets.xcassets/` (добавить 3 imagesets)

- [x] **Создать директории и Contents.json для club1**

```bash
mkdir -p "club-finder/ios/ClubFinder/Assets.xcassets/club1.imageset"
```

Создать `club-finder/ios/ClubFinder/Assets.xcassets/club1.imageset/Contents.json`:
```json
{
  "images" : [
    {
      "filename" : "club1.jpg",
      "idiom" : "universal",
      "scale" : "1x"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
```

Скопировать изображение:
```bash
cp "club-finder/src/assets/club1.jpg" "club-finder/ios/ClubFinder/Assets.xcassets/club1.imageset/club1.jpg"
```

- [x] **Создать imageset для club2**

```bash
mkdir -p "club-finder/ios/ClubFinder/Assets.xcassets/club2.imageset"
```

Создать `club-finder/ios/ClubFinder/Assets.xcassets/club2.imageset/Contents.json`:
```json
{
  "images" : [
    {
      "filename" : "club2.jpg",
      "idiom" : "universal",
      "scale" : "1x"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
```

```bash
cp "club-finder/src/assets/club2.jpg" "club-finder/ios/ClubFinder/Assets.xcassets/club2.imageset/club2.jpg"
```

- [x] **Создать imageset для club3**

```bash
mkdir -p "club-finder/ios/ClubFinder/Assets.xcassets/club3.imageset"
```

Создать `club-finder/ios/ClubFinder/Assets.xcassets/club3.imageset/Contents.json`:
```json
{
  "images" : [
    {
      "filename" : "club3.jpg",
      "idiom" : "universal",
      "scale" : "1x"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
```

```bash
cp "club-finder/src/assets/club3.jpg" "club-finder/ios/ClubFinder/Assets.xcassets/club3.imageset/club3.jpg"
```

- [x] **Commit**

```bash
git add club-finder/ios/ClubFinder/Assets.xcassets/
git commit -m "feat(ios): add club1/2/3 fallback banner images to Assets"
```

---

### Task 4: HomeView — баннер-карусель

**Files:**
- Modify: `club-finder/ios/ClubFinder/Views/Home/HomeView.swift`

- [x] **Полностью заменить содержимое `HomeView.swift`**

```swift
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
    @StateObject private var location = LocationService.shared
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

    @ViewBuilder
    private var bannerCarousel: some View {
        if banners.isEmpty {
            TabView(selection: $currentBanner) {
                ForEach(fallbackBanners) { b in
                    fallbackSlide(b)
                        .tag(b.id)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .automatic))
            .frame(height: 180)
            .cornerRadius(16)
            .padding(.horizontal)
        } else {
            TabView(selection: $currentBanner) {
                ForEach(banners) { banner in
                    apiBannerSlide(banner)
                        .tag(banner.id)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .automatic))
            .frame(height: 180)
            .cornerRadius(16)
            .padding(.horizontal)
        }
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
        let imageURL: URL? = {
            if banner.image_url.hasPrefix("http") {
                return URL(string: banner.image_url)
            }
            let base = APIService.shared.baseURL.replacingOccurrences(of: "/api", with: "")
            return URL(string: base + banner.image_url)
        }()
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
```

- [x] **Commit**

```bash
git add club-finder/ios/ClubFinder/Views/Home/HomeView.swift
git commit -m "feat(ios): add banner carousel to HomeView"
```

---

### Task 5: FRAG.GG логотип в Assets.xcassets

**Files:**
- Modify: `club-finder/ios/ClubFinder/Assets.xcassets/` (добавить frag-logo imageset)

- [x] **Создать imageset для frag-logo**

```bash
mkdir -p "club-finder/ios/ClubFinder/Assets.xcassets/frag-logo.imageset"
cp "club-finder/src/assets/frag.png" "club-finder/ios/ClubFinder/Assets.xcassets/frag-logo.imageset/frag-logo.png"
```

Создать `club-finder/ios/ClubFinder/Assets.xcassets/frag-logo.imageset/Contents.json`:
```json
{
  "images" : [
    {
      "filename" : "frag-logo.png",
      "idiom" : "universal",
      "scale" : "1x"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
```

- [x] **Commit**

```bash
git add club-finder/ios/ClubFinder/Assets.xcassets/frag-logo.imageset/
git commit -m "feat(ios): add frag-logo asset"
```

---

### Task 6: Backend — поддержка iOS redirect для FACEIT OAuth

**Files:**
- Modify: `backend/app.py` строки ~1714–1805

- [x] **Добавить чтение `source` из state JSON**

В `backend/app.py`, найди блок (около строки 1716):
```python
        try:
            padding = (4 - len(state) % 4) % 4
            state_data = _json.loads(_b64.urlsafe_b64decode(state + "=" * padding).decode())
            code_verifier = state_data.get("v")
            link_token = state_data.get("link_token")
        except Exception:
            pass
```

Замени на:
```python
        try:
            padding = (4 - len(state) % 4) % 4
            state_data = _json.loads(_b64.urlsafe_b64decode(state + "=" * padding).decode())
            code_verifier = state_data.get("v")
            link_token = state_data.get("link_token")
            source = state_data.get("source", "web")
        except Exception:
            source = "web"
            pass
```

- [x] **Добавить переменную `IOS_SCHEME` и обновить redirect в link flow**

Сразу после строки `FRONTEND = "https://cloud.icafedash.com"` добавь:
```python
    IOS_SCHEME = "fraggg://auth/faceit/callback"
```

Найди блок (около строки 1798):
```python
                qs = f"linked=true&faceit_id={_urlparse.quote(faceit_id)}"
                if faceit_elo is not None:
                    qs += f"&faceit_elo={faceit_elo}"
                if faceit_level is not None:
                    qs += f"&faceit_level={faceit_level}"
                if link_user.avatar_url:
                    qs += f"&avatar_url={_urlparse.quote(link_user.avatar_url)}"
                return _redirect(f"{FRONTEND}/auth/faceit/callback?{qs}")
```

Замени последнюю строку:
```python
                base = IOS_SCHEME if source == "ios" else f"{FRONTEND}/auth/faceit/callback"
                return _redirect(f"{base}?{qs}")
```

- [x] **Commit**

```bash
git add backend/app.py
git commit -m "feat(backend): support source=ios redirect to fraggg:// in FACEIT OAuth callback"
```

---

### Task 7: Info.plist — URL Scheme `fraggg`

**Files:**
- Modify: `club-finder/ios/ClubFinder/Info.plist`

- [x] **Добавить CFBundleURLTypes в Info.plist**

Найди строку:
```xml
    <key>UIUserInterfaceStyle</key>
```

Вставь перед ней:
```xml
    <key>CFBundleURLTypes</key>
    <array>
        <dict>
            <key>CFBundleURLName</key>
            <string>com.icafedash.clubfinder</string>
            <key>CFBundleURLSchemes</key>
            <array>
                <string>fraggg</string>
            </array>
        </dict>
    </array>
```

- [x] **Commit**

```bash
git add club-finder/ios/ClubFinder/Info.plist
git commit -m "feat(ios): add fraggg:// URL scheme for FACEIT OAuth callback"
```

---

### Task 8: AuthService — linkFaceit() через ASWebAuthenticationSession

**Files:**
- Modify: `club-finder/ios/ClubFinder/Services/AuthService.swift`

- [x] **Полностью заменить содержимое `AuthService.swift`**

```swift
import Foundation
import SwiftUI
import AuthenticationServices
import CryptoKit

// MARK: - FACEIT OAuth helper

private final class FaceitWindowProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first(where: \.isKeyWindow) ?? UIWindow()
    }
}

private func makeCodeVerifier() -> String {
    var bytes = [UInt8](repeating: 0, count: 32)
    _ = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
    return Data(bytes).base64EncodedString()
        .replacingOccurrences(of: "+", with: "-")
        .replacingOccurrences(of: "/", with: "_")
        .replacingOccurrences(of: "=", with: "")
}

private func makeCodeChallenge(verifier: String) -> String {
    let data = Data(verifier.utf8)
    let hash = SHA256.hash(data: data)
    return Data(hash).base64EncodedString()
        .replacingOccurrences(of: "+", with: "-")
        .replacingOccurrences(of: "/", with: "_")
        .replacingOccurrences(of: "=", with: "")
}

// MARK: - AuthService

class AuthService: ObservableObject {
    static let shared = AuthService()

    @Published var user: ClientUser?
    @Published var token: String?
    @Published var isLoggedIn = false

    private let tokenKey = "icafe_client_token"
    private let userKey  = "icafe_client_user"

    private let faceitClientID  = "38961025-aebd-41f7-8424-86879eb9f6af"
    private let faceitRedirect  = "https://cloud.icafedash.com/api/auth/faceit/oauth-callback"
    private var faceitWindowProvider = FaceitWindowProvider()

    init() { loadFromStorage() }

    // MARK: Login / Logout

    func login(token: String, user: ClientUser) {
        self.token = token
        self.user  = user
        self.isLoggedIn = true
        saveToStorage()
    }

    func logout() {
        self.token = nil
        self.user  = nil
        self.isLoggedIn = false
        UserDefaults.standard.removeObject(forKey: tokenKey)
        UserDefaults.standard.removeObject(forKey: userKey)
    }

    func updateUser(_ user: ClientUser) {
        self.user = user
        saveToStorage()
    }

    // MARK: FACEIT OAuth

    @MainActor
    func linkFaceit(token: String) async throws {
        let verifier  = makeCodeVerifier()
        let challenge = makeCodeChallenge(verifier: verifier)

        // Build state JSON: {v, link_token, source}
        let stateDict: [String: String] = ["v": verifier, "link_token": token, "source": "ios"]
        let stateData = try JSONEncoder().encode(stateDict)
        let state = stateData.base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")

        var comps = URLComponents(string: "https://accounts.faceit.com/accounts")!
        comps.queryItems = [
            URLQueryItem(name: "client_id",              value: faceitClientID),
            URLQueryItem(name: "redirect_uri",           value: faceitRedirect),
            URLQueryItem(name: "response_type",          value: "code"),
            URLQueryItem(name: "scope",                  value: "openid email membership"),
            URLQueryItem(name: "state",                  value: state),
            URLQueryItem(name: "code_challenge",         value: challenge),
            URLQueryItem(name: "code_challenge_method",  value: "S256"),
        ]
        guard let url = comps.url else { throw APIError.invalidURL }

        let callbackURL: URL = try await withCheckedThrowingContinuation { cont in
            let session = ASWebAuthenticationSession(url: url, callbackURLScheme: "fraggg") { url, error in
                if let error = error {
                    cont.resume(throwing: error)
                } else if let url = url {
                    cont.resume(returning: url)
                } else {
                    cont.resume(throwing: APIError.serverError("Нет callback URL"))
                }
            }
            session.presentationContextProvider = self.faceitWindowProvider
            session.prefersEphemeralWebBrowserSession = false
            session.start()
        }

        // Parse callback params
        let cbComps = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false)
        let params  = Dictionary(
            uniqueKeysWithValues: (cbComps?.queryItems ?? []).compactMap { item -> (String, String)? in
                guard let v = item.value else { return nil }
                return (item.name, v)
            }
        )

        if let err = params["faceit_error"] {
            throw APIError.serverError(err.replacingOccurrences(of: "_", with: " "))
        }
        guard let faceitId = params["faceit_id"] else {
            throw APIError.serverError("Нет faceit_id в ответе")
        }

        guard let current = self.user else { return }
        let updated = ClientUser(
            id:           current.id,
            username:     current.username,
            email:        current.email,
            role:         current.role,
            avatar_url:   params["avatar_url"] ?? current.avatar_url,
            faceit_id:    faceitId,
            faceit_elo:   params["faceit_elo"].flatMap(Int.init),
            faceit_level: params["faceit_level"].flatMap(Int.init)
        )
        self.updateUser(updated)
    }

    // MARK: Storage

    private func saveToStorage() {
        UserDefaults.standard.set(token, forKey: tokenKey)
        if let user, let data = try? JSONEncoder().encode(user) {
            UserDefaults.standard.set(data, forKey: userKey)
        }
    }

    private func loadFromStorage() {
        token = UserDefaults.standard.string(forKey: tokenKey)
        if let data = UserDefaults.standard.data(forKey: userKey),
           let user = try? JSONDecoder().decode(ClientUser.self, from: data) {
            self.user = user
            self.isLoggedIn = token != nil
        }
    }
}
```

- [x] **Commit**

```bash
git add club-finder/ios/ClubFinder/Services/AuthService.swift
git commit -m "feat(ios): add FACEIT OAuth via ASWebAuthenticationSession"
```

---

### Task 9: ProfileView — кнопки FACEIT

**Files:**
- Modify: `club-finder/ios/ClubFinder/Views/Profile/ProfileView.swift`

- [x] **Найти блок Actions (строки ~122–141) и добавить FACEIT кнопки**

Найди в `ProfileView.swift`:
```swift
                // Actions
                VStack(spacing: 8) {
                    NavigationLink(destination: ProfileSettingsView()) {
                        SettingsRow(icon: "gearshape", text: "Настройки")
                    }
```

Замени весь блок `// Actions` (до закрывающей `}` блока `VStack(spacing: 8)`) на:
```swift
                // FACEIT
                faceitSection

                // Actions
                VStack(spacing: 8) {
                    NavigationLink(destination: ProfileSettingsView()) {
                        SettingsRow(icon: "gearshape", text: "Настройки")
                    }

                    NavigationLink(destination: CashbackView()) {
                        SettingsRow(icon: "creditcard", text: "Кэшбэк")
                    }

                    NavigationLink(destination: BookingView()) {
                        SettingsRow(icon: "calendar", text: "Мои бронирования")
                    }

                    Button {
                        auth.logout()
                    } label: {
                        SettingsRow(icon: "rectangle.portrait.and.arrow.right", text: "Выйти", isDestructive: true)
                    }
                }
```

- [x] **Добавить `@State` переменные и `faceitSection` в `ProfileView`**

В начало `ProfileView` (после `@State private var showSettings = false`) добавь:
```swift
    @State private var faceitLoading = false
    @State private var faceitError: String?
    @State private var faceitToast: String?
    @State private var showFaceitToast = false
```

После закрывающей `}` метода `loadBanners` (или перед `FaceitStatsGridView`) добавь computed var:
```swift
    @ViewBuilder
    private var faceitSection: some View {
        if auth.user?.faceit_id == nil {
            Button {
                guard let token = auth.token else { return }
                faceitLoading = true
                Task {
                    do {
                        try await auth.linkFaceit(token: token)
                        showToast("FACEIT успешно привязан!")
                    } catch let error as ASWebAuthenticationSessionError
                          where error.code == .canceledLogin {
                        showToast("Авторизация отменена")
                    } catch {
                        showToast(error.localizedDescription)
                    }
                    faceitLoading = false
                }
            } label: {
                HStack(spacing: 12) {
                    if faceitLoading {
                        ProgressView().tint(.white).frame(width: 24)
                    } else {
                        Image(systemName: "link")
                            .font(.system(size: 16))
                            .foregroundColor(Color(hex: "#FF7800"))
                            .frame(width: 24)
                    }
                    Text("Привязать FACEIT")
                        .font(.system(size: 15))
                        .foregroundColor(.white)
                    Spacer()
                }
                .padding(14)
                .background(Color.white.opacity(0.05))
                .cornerRadius(12)
            }
            .disabled(faceitLoading)
        } else {
            Button {
                guard let token = auth.token else { return }
                Task {
                    if let result = try? await APIService.shared.unlinkFaceit(token: token) {
                        let u = auth.user!
                        auth.updateUser(ClientUser(
                            id: u.id, username: u.username, email: u.email,
                            role: u.role,
                            avatar_url: result["avatar_url"] ?? u.avatar_url,
                            faceit_id: nil, faceit_elo: nil, faceit_level: nil
                        ))
                        showToast("FACEIT отвязан")
                    }
                }
            } label: {
                HStack(spacing: 12) {
                    Image(systemName: "link.badge.minus")
                        .font(.system(size: 16))
                        .foregroundColor(.red)
                        .frame(width: 24)
                    Text("Отвязать FACEIT")
                        .font(.system(size: 15))
                        .foregroundColor(.red)
                    Spacer()
                }
                .padding(14)
                .background(Color.white.opacity(0.05))
                .cornerRadius(12)
            }
        }
    }

    private func showToast(_ message: String) {
        faceitToast = message
        showFaceitToast = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
            showFaceitToast = false
        }
    }
```

- [x] **Добавить toast overlay к ScrollView**

Найди `.background(Color(hex: "#121315"))` в `ProfileView` и добавь после него:
```swift
        .overlay(alignment: .bottom) {
            if showFaceitToast, let msg = faceitToast {
                Text(msg)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(Color(hex: "#1E1E2E").opacity(0.95))
                    .cornerRadius(20)
                    .padding(.bottom, 90)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                    .animation(.easeInOut(duration: 0.3), value: showFaceitToast)
            }
        }
```

- [x] **Добавить import AuthenticationServices в начало файла**

В самом начале `ProfileView.swift` добавь:
```swift
import AuthenticationServices
```

- [x] **Commit**

```bash
git add club-finder/ios/ClubFinder/Views/Profile/ProfileView.swift
git commit -m "feat(ios): add FACEIT link/unlink buttons to ProfileView"
```

---

### Task 10: TournamentGameRatingView (статичные данные)

**Files:**
- Create: `club-finder/ios/ClubFinder/Views/Tournaments/TournamentGameRatingView.swift`

- [x] **Создать файл**

```swift
import SwiftUI

private struct GameTeam: Identifiable {
    let id: Int
    let name: String
    let points: Int
    let wins: Int
    let accent: Color
}

private struct GameRatingData {
    let title: String
    let imageName: String
    let teams: [GameTeam]
}

private let gameData: [String: GameRatingData] = [
    "cs2": GameRatingData(
        title: "CS2",
        imageName: "cs2-banner",
        teams: [
            GameTeam(id: 1, name: "TeamPro Sergeli",  points: 1280, wins: 14, accent: Color(hex: "#FEE75C")),
            GameTeam(id: 2, name: "Energy Gaming",    points: 1195, wins: 12, accent: Color(hex: "#C0C0C0")),
            GameTeam(id: 3, name: "Cloud1 Squad",     points: 1110, wins: 10, accent: Color(hex: "#CD7F32")),
            GameTeam(id: 4, name: "OpenSpace Crew",   points:  980, wins:  9, accent: Color(hex: "#FF7800")),
            GameTeam(id: 5, name: "Main Arena",       points:  910, wins:  8, accent: Color(hex: "#FF7800")),
        ]
    ),
    "dota2": GameRatingData(
        title: "Dota 2",
        imageName: "dota2-banner",
        teams: [
            GameTeam(id: 1, name: "Ancient Stars",   points: 1325, wins: 15, accent: Color(hex: "#FEE75C")),
            GameTeam(id: 2, name: "Radiant Force",   points: 1200, wins: 13, accent: Color(hex: "#C0C0C0")),
            GameTeam(id: 3, name: "Dire Squad",      points: 1090, wins: 11, accent: Color(hex: "#CD7F32")),
            GameTeam(id: 4, name: "MidLane Kings",   points:  990, wins:  9, accent: Color(hex: "#FF7800")),
            GameTeam(id: 5, name: "Roshan Hunters",  points:  920, wins:  8, accent: Color(hex: "#FF7800")),
        ]
    ),
    "pubg-mobile": GameRatingData(
        title: "PUBG Mobile",
        imageName: "pubg-banner",
        teams: [
            GameTeam(id: 1, name: "DropZone Five",   points: 1360, wins: 16, accent: Color(hex: "#FEE75C")),
            GameTeam(id: 2, name: "Survivor Unit",   points: 1230, wins: 13, accent: Color(hex: "#C0C0C0")),
            GameTeam(id: 3, name: "Zone Masters",    points: 1120, wins: 11, accent: Color(hex: "#CD7F32")),
            GameTeam(id: 4, name: "AirDrop Crew",    points: 1005, wins: 10, accent: Color(hex: "#FF7800")),
            GameTeam(id: 5, name: "Final Circle",    points:  940, wins:  8, accent: Color(hex: "#FF7800")),
        ]
    ),
]

struct TournamentGameRatingView: View {
    let gameId: String

    private let accent = Color(hex: "#FF7800")

    private var data: GameRatingData? { gameData[gameId] }

    var body: some View {
        ScrollView {
            if let d = data {
                VStack(alignment: .leading, spacing: 16) {
                    // Game header card
                    ZStack(alignment: .bottomLeading) {
                        if UIImage(named: d.imageName) != nil {
                            Image(d.imageName)
                                .resizable()
                                .scaledToFill()
                                .frame(maxWidth: .infinity)
                                .frame(height: 122)
                                .clipped()
                        } else {
                            Rectangle()
                                .fill(Color.white.opacity(0.05))
                                .frame(height: 122)
                        }
                        LinearGradient(
                            gradient: Gradient(colors: [.black.opacity(0.8), .clear]),
                            startPoint: .leading, endPoint: .trailing
                        )
                        HStack(spacing: 12) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(Color(hex: "#1A1B1F"))
                                    .frame(width: 40, height: 40)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 12)
                                            .stroke(Color(hex: "#2F3136"), lineWidth: 1)
                                    )
                                Image(systemName: "trophy.fill")
                                    .foregroundColor(accent)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(d.title)
                                    .font(.system(size: 30, weight: .bold))
                                    .foregroundColor(.white)
                                Text("Топ команд по рейтингу")
                                    .font(.system(size: 12))
                                    .foregroundColor(Color(hex: "#C4CAD2"))
                            }
                        }
                        .padding(14)
                    }
                    .cornerRadius(16)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color(hex: "#2F3136"), lineWidth: 1)
                    )

                    // Header row
                    HStack {
                        Text("Топ по рейтингу")
                            .font(.system(size: 26, weight: .bold))
                            .foregroundColor(.white)
                        Spacer()
                        Text("Сезон 2026")
                            .font(.system(size: 11))
                            .foregroundColor(Color(hex: "#949BA4"))
                            .textCase(.uppercase)
                    }

                    // Teams list
                    VStack(spacing: 8) {
                        ForEach(Array(d.teams.enumerated()), id: \.element.id) { idx, team in
                            HStack(spacing: 12) {
                                // Rank badge
                                ZStack {
                                    Circle()
                                        .fill(Color(hex: "#1E1E1E"))
                                        .frame(width: 28, height: 28)
                                        .overlay(Circle().stroke(Color(hex: "#2F3136"), lineWidth: 1))
                                    Text("\(idx + 1)")
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundColor(team.accent)
                                }

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(team.name)
                                        .font(.system(size: 14, weight: .semibold))
                                        .foregroundColor(.white)
                                    Text("Побед: \(team.wins)")
                                        .font(.system(size: 11))
                                        .foregroundColor(Color(hex: "#949BA4"))
                                }

                                Spacer()

                                VStack(alignment: .trailing, spacing: 2) {
                                    Text("\(team.points)")
                                        .font(.system(size: 14, weight: .bold))
                                        .foregroundColor(accent)
                                    Text("PTS")
                                        .font(.system(size: 10))
                                        .foregroundColor(Color(hex: "#949BA4"))
                                }
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 10)
                            .background(Color(hex: "#141414"))
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color(hex: "#2A2A2A"), lineWidth: 1)
                            )
                        }
                    }
                    .padding(12)
                    .background(
                        LinearGradient(
                            gradient: Gradient(colors: [Color(hex: "#151515"), Color(hex: "#101010")]),
                            startPoint: .top, endPoint: .bottom
                        )
                    )
                    .cornerRadius(16)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color(hex: "#2F3136"), lineWidth: 1)
                    )
                }
                .padding(.horizontal)
                .padding(.top, 12)
            } else {
                Text("Раздел не найден.")
                    .foregroundColor(.gray)
                    .padding(.top, 40)
            }
        }
        .background(Color(hex: "#121315"))
        .navigationTitle(data?.title ?? "Рейтинг")
        .navigationBarTitleDisplayMode(.inline)
    }
}
```

- [x] **Commit**

```bash
git add club-finder/ios/ClubFinder/Views/Tournaments/TournamentGameRatingView.swift
git commit -m "feat(ios): add TournamentGameRatingView with static game data"
```

---

### Task 11: TournamentsView — кнопки перехода к рейтингам

**Files:**
- Modify: `club-finder/ios/ClubFinder/Views/Tournaments/TournamentsView.swift`

- [x] **Прочитать файл, найти конец списка турниров**

Открой `TournamentsView.swift`. Найди `.task` или `.refreshable` модификатор в конце `body`. Перед ним найди закрывающую `}` основного `LazyVStack` или `VStack` со списком турниров.

- [x] **Добавить секцию "Рейтинги по играм" после списка турниров**

Прямо перед закрывающей `}` основного `VStack` в `body` (после блока с `LazyVStack(ForEach(tournaments))` или пустого состояния) добавь:

```swift
                // Game ratings section
                VStack(alignment: .leading, spacing: 10) {
                    Text("Рейтинги по играм")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(.white)

                    ForEach([("cs2", "CS2"), ("dota2", "Dota 2"), ("pubg-mobile", "PUBG Mobile")], id: \.0) { gameId, title in
                        NavigationLink(destination: TournamentGameRatingView(gameId: gameId)) {
                            HStack {
                                Image(systemName: "trophy.fill")
                                    .foregroundColor(Color(hex: "#FF7800"))
                                Text(title)
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundColor(.white)
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 12))
                                    .foregroundColor(.gray)
                            }
                            .padding(14)
                            .background(Color.white.opacity(0.05))
                            .cornerRadius(12)
                        }
                    }
                }
                .padding(.horizontal)
                .padding(.top, 8)
```

- [x] **Commit**

```bash
git add club-finder/ios/ClubFinder/Views/Tournaments/TournamentsView.swift
git commit -m "feat(ios): add game rating navigation links to TournamentsView"
```

---

## Self-review checklist

- [x] Banner модель + getBanners() + карусель с fallback — Tasks 1–4
- [x] FRAG.GG логотип — Task 5 (assets) + Task 4 (toolbar в HomeView)
- [x] Backend iOS redirect — Task 6
- [x] URL Scheme fraggg:// — Task 7
- [x] FACEIT OAuth ASWebAuthenticationSession — Task 8
- [x] ProfileView кнопки привязать/отвязать + toast — Task 9
- [x] TournamentGameRatingView — Task 10
- [x] Навигация из TournamentsView — Task 11
- [x] Все типы согласованы: `ClientUser` инициализируется с `(id:username:email:role:avatar_url:faceit_id:faceit_elo:faceit_level:)` — совпадает с `User.swift`
- [x] `APIError` используется из существующего `APIService.swift`
- [x] `Color(hex:)` extension уже есть в `MainTabView.swift`
