# iOS ClubFinder — Design Spec

**Date:** 2026-03-31  
**Project:** `club-finder/ios/ClubFinder/`  
**Goal:** Довести существующий iOS проект до полного 1-в-1 соответствия с веб-версией `cloud.icafedash.com`

---

## Контекст

В репозитории уже существует iOS проект (~2947 строк Swift) с полным набором экранов, сервисов и моделей. Подход — **точечный патч**: добавляем недостающее, не ломая рабочее.

### Существующая архитектура (без изменений)

| Слой | Файлы |
|------|-------|
| **App** | `App/ClubFinderApp.swift` — `@main`, dark theme, `AuthService` как `@StateObject` |
| **Navigation** | `Views/MainTabView.swift` — 5 табов: Клубы / Карта / Турниры / Трансфер / Профиль |
| **Services** | `APIService.swift`, `AuthService.swift`, `LocationService.swift` |
| **Models** | `Club`, `User`, `Booking`, `Cashback`, `Tournament`, `Transfer`, `Faceit` |
| **Theme** | Background `#121315`, accent `#FF7800`, dark color scheme |

### Уже реализованные экраны (не затрагиваем)

- `HomeView` — список клубов, поиск, сортировка по геолокации
- `ClubDetailView` — фото-карусель, описание, зоны ПК, отзывы
- `AuthView` — логин / регистрация / email верификация
- `BookingView` — выбор зоны/ПК, мои бронирования
- `MapScreenView` — карта клубов (Leaflet → MapKit)
- `TournamentsView` + `TournamentDetailView`
- `TransferView` + `PlayerProfileView`
- `ProfileView` + `ProfileSettingsView`
- `CashbackView`, `FaceitRankingsView`, `RatingsView`

---

## Что нужно добавить

### 1. Баннер-карусель на HomeView

**Веб-поведение:** вверху главного экрана — карусель из динамических баннеров, загруженных через API. Если API вернул пустой массив — показываем 3 fallback-слайда.

**Изменения:**

- **`Models/Banner.swift`** (новый файл):
  ```swift
  struct Banner: Identifiable, Decodable {
      let id: Int
      let title: String
      let subtitle: String
      let image_url: String
      let link_url: String?
  }
  ```

- **`Services/APIService.swift`** — добавить метод:
  ```swift
  func getBanners() async throws -> [Banner] {
      try await request("/public/banners")
  }
  ```

- **`Views/Home/HomeView.swift`** — добавить в начало `ScrollView`:
  - `@State private var banners: [Banner] = []`
  - `TabView` с `.tabViewStyle(.page(indexDisplayMode: .automatic))`, высота 180pt
  - Каждый слайд: `AsyncImage` + title/subtitle overlay снизу
  - Загрузка в `.task` вместе с клубами; при ошибке — 3 fallback-слайда (статичные ассеты)

**Fallback слайды:**
```
"Турнирный сезон" / "CS2 / Dota 2 / Valorant"
"Ночные скидки"   / "Пакеты до -25% после 23:00"
"VIP-зоны"        / "Комфортные кабины для сквадов"
```
Изображения: `club1`, `club2`, `club3` — скопировать из `club-finder/src/assets/` и добавить в `Assets.xcassets`.

**Обработка ошибок:** API недоступен → тихо подставляем fallback, никакого алерта.

---

### 2. FACEIT OAuth — ASWebAuthenticationSession

**Веб-поведение:** кнопка "Привязать FACEIT" открывает popup `accounts.faceit.com`, после авторизации backend делает redirect с параметрами `faceit_id`, `faceit_elo`, `faceit_level`, `avatar_url`.

**Поток на iOS:**
```
Кнопка "Привязать FACEIT"
  → AuthService.linkFaceit(token:)
    → ASWebAuthenticationSession(
          url: accounts.faceit.com/accounts?client_id=...&redirect_uri=.../oauth-callback,
          callbackURLScheme: "fraggg"
      )
      → Backend /api/auth/faceit/oauth-callback
        → redirect → fraggg://faceit?faceit_id=&elo=&level=&avatar_url=
          → ASWebAuth возвращает callbackURL
            → парсим params → updateUser()
```

**Изменения:**

- **`Info.plist`** — добавить URL Scheme `fraggg`:
  ```xml
  <key>CFBundleURLTypes</key>
  <array>
    <dict>
      <key>CFBundleURLSchemes</key>
      <array><string>fraggg</string></array>
    </dict>
  </array>
  ```

- **`Services/AuthService.swift`** — добавить:
  ```swift
  @MainActor
  func linkFaceit(token: String, presentationAnchor: ASPresentationAnchor) async throws {
      // строим URL accounts.faceit.com с client_id и redirect_uri
      // запускаем ASWebAuthenticationSession
      // парсим callbackURL → updateUser(faceit_id:elo:level:avatar_url:)
  }
  ```
  Константы: `FACEIT_CLIENT_ID = "38961025-aebd-41f7-8424-86879eb9f6af"`, redirect URI `https://cloud.icafedash.com/api/auth/faceit/oauth-callback?source=ios`.

  **Важно:** backend (`app.py`, маршрут `/api/auth/faceit/oauth-callback`) должен при наличии `?source=ios` делать redirect на `fraggg://faceit?...` вместо веб-URL. Это единственное изменение в backend.

- **`Views/Profile/ProfileView.swift`** — добавить:
  - Если `auth.user?.faceit_id == nil`: кнопка **"Привязать FACEIT"** → вызов `linkFaceit`
  - Если привязан: кнопка **"Отвязать"** → вызов `APIService.unlinkFaceit(token:)` → `updateUser`

**Обработка ошибок:**
- Пользователь закрыл окно (`ASWebAuthenticationSessionError.canceledLogin`) → toast "Авторизация отменена"
- URL содержит `faceit_error=` → toast с текстом ошибки
- Успех → обновляется профиль, кнопка меняется на "Отвязать"

---

### 3. TournamentGameRatingView (новый экран)

**Веб-поведение:** таблица рейтинга игроков по конкретной игре в рамках турнира. Навигация из `TournamentDetailsPage`.

**Изменения:**

- **`Services/APIService.swift`** — добавить:
  ```swift
  func getTournamentGameRating(id: Int, game: String) async throws -> [GameRatingPlayer] {
      try await request("/public/tournaments/\(id)/game-rating",
                        queryItems: [.init(name: "game", value: game)])
  }
  ```

- **`Models/Tournament.swift`** — добавить модель:
  ```swift
  struct GameRatingPlayer: Identifiable, Decodable {
      let id: Int
      let username: String
      let avatar_url: String?
      let score: Int
      let rank: Int
  }
  ```

- **`Views/Tournaments/TournamentGameRatingView.swift`** (новый файл):
  - Параметры: `tournamentId: Int`, `game: String`
  - `List` игроков: ранг, аватар, username, очки
  - Пустой список → "Рейтинг пока не сформирован"
  - Ошибка → retry кнопка

- **`Views/Tournaments/TournamentDetailView.swift`** — добавить `NavigationLink` на `TournamentGameRatingView`

---

### 4. FRAG.GG логотип в HomeView

**Веб-поведение:** в хедере главной страницы отображается логотип FRAG.GG (`frag.png`).

**Изменения:**

- **`Assets.xcassets`** — добавить `frag-logo` (PNG из `club-finder/src/assets/frag.png`)

- **`Views/Home/HomeView.swift`** — заменить `.navigationTitle("Клубы")` на:
  ```swift
  .navigationBarTitleDisplayMode(.inline)
  .toolbar {
      ToolbarItem(placement: .principal) {
          Image("frag-logo")
              .resizable()
              .scaledToFit()
              .frame(height: 28)
      }
  }
  ```
  Fallback если ассет отсутствует: `Text("FRAG.GG").font(.system(size: 18, weight: .black)).foregroundColor(Color(hex: "#FF7800"))`

---

## Порядок реализации

| # | Задача | Файлы |
|---|--------|-------|
| 1 | Banner модель + getBanners() + HomeView карусель | `Banner.swift`, `APIService.swift`, `HomeView.swift` |
| 2 | FRAG.GG лого в HomeView | `HomeView.swift`, `Assets.xcassets` |
| 3 | FACEIT OAuth (ASWebAuthenticationSession) | `Info.plist`, `AuthService.swift`, `ProfileView.swift` |
| 4 | TournamentGameRatingView | `APIService.swift`, `Tournament.swift`, новый View, `TournamentDetailView.swift` |

---

## Итог по файлам

**Новые файлы:**
- `club-finder/ios/ClubFinder/Models/Banner.swift`
- `club-finder/ios/ClubFinder/Views/Tournaments/TournamentGameRatingView.swift`

**Backend (минимальное изменение):**
- `backend/app.py` — маршрут `/api/auth/faceit/oauth-callback`: добавить обработку `?source=ios` → redirect на `fraggg://faceit?...`

**Изменяемые файлы:**
- `club-finder/ios/ClubFinder/Services/APIService.swift`
- `club-finder/ios/ClubFinder/Services/AuthService.swift`
- `club-finder/ios/ClubFinder/Views/Home/HomeView.swift`
- `club-finder/ios/ClubFinder/Views/Profile/ProfileView.swift`
- `club-finder/ios/ClubFinder/Views/Tournaments/TournamentDetailView.swift`
- `club-finder/ios/ClubFinder/App/Info.plist`
- `club-finder/ios/ClubFinder/Assets.xcassets` (добавить frag-logo)
