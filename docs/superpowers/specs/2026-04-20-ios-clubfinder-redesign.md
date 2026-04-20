# iOS ClubFinder — Редизайн и исправление багов

**Дата:** 2026-04-20  
**Статус:** Approved

---

## Цель

Привести iOS-приложение ClubFinder в соответствие с веб-версией (cloud.icafedash.com):
- Исправить сломанные функции (тап по клубу, турниры, game ratings)
- Добавить отсутствующие экраны (CYBER UNION рейтинги, Ratings Hub)
- Перестроить навигацию 1:1 с вебом
- Перенести Transfer в Профиль

---

## 1. Навигация

### Было (5 вкладок)
`Клубы | Карта | Турниры | Трансфер | Профиль`

### Стало (5 вкладок)
`Клубы | Карта | Турниры | Рейтинги | Профиль`

- Вкладка **Рейтинги** — новая, заменяет Трансфер
- **Transfer** перемещается в меню Профиля (кнопка-строка, как Кэшбэк/Бронирования)

---

## 2. Исправление сломанных функций

### 2.1 Тап по клубу не открывает ClubDetailView
- **Причина:** `NavigationLink(destination: ClubDetailView(clubId: club.id))` — возможно конфликт с `NavigationStack` + `LazyVStack` в `HomeView`
- **Fix:** Заменить `NavigationLink` на `.navigationDestination(for: Int.self)` + `NavigationLink(value: club.id)` для правильной работы в `NavigationStack`

### 2.2 Турниры не работают
- **Причина:** API `/api/public/tournaments` возвращает данные, но декодирование может падать из-за несовпадения полей модели
- **Fix:** Проверить и выровнять модель `PublicTournament` с реальным ответом API; добавить обработку ошибок с отображением пользователю

### 2.3 TournamentGameRating использует неверный API
- **Текущий:** `GET /api/public/tournaments/:id/game-rating` — турнир-специфичный
- **Нужный:** CYBER UNION API (см. раздел 3)
- **Fix:** Удалить `TournamentGameRatingView` из Tournaments, заменить ссылками на новый `CyberUnionView`

---

## 3. Новые экраны

### 3.1 RatingsHubView (заменяет старый RatingsView)
**Файл:** `Views/Ratings/RatingsHubView.swift`

Список навигационных карточек:
- **CYBER UNION CS2** → `CyberUnionView(game: "cs2")`
- **CYBER UNION PUBG Mobile** → `CyberUnionView(game: "pubg-mobile")`
- **FACEIT Uzbekistan** → `FaceitRankingsView()` (уже существует)

### 3.2 CyberUnionView
**Файл:** `Views/Ratings/CyberUnionView.swift`

Экран с двумя вкладками (Picker segmented):
- **Команды** — список с пагинацией, раскрывающийся состав
- **Игроки** — список с пагинацией

**Команды (строка):**
- Место (#1, #2...) — цвет золото/серебро/бронза для топ-3
- Логотип команды (AsyncImage)
- Название команды
- Счёт WINS
- Стрелка → раскрывает состав (expandable)

**Игроки (строка):**
- Место
- Аватар
- Никнейм
- FaceitLevelBadge (elo + level)
- WINS

**Пагинация:** кнопка "Загрузить ещё" внизу списка (page += 1)

### 3.3 Новые модели (Models/CyberUnion.swift)
```swift
struct CyberUnionTeam: Codable, Identifiable {
    let id: Int
    let team_name: String
    let logo_url: String?
    let score: Int
    let rank: Int
}

struct CyberUnionPlayer: Codable, Identifiable {
    let id: Int
    let username: String
    let avatar_url: String?
    let faceit_elo: Int?
    let faceit_level: Int?
    let score: Int
    let rank: Int
    let team_name: String?
}

struct CyberUnionTeamPlayer: Codable, Identifiable {
    let id: Int
    let username: String
    let avatar_url: String?
    let faceit_elo: Int?
    let faceit_level: Int?
}

struct CyberUnionTeamsResponse: Codable {
    let items: [CyberUnionTeam]
    let total: Int
}

struct CyberUnionPlayersResponse: Codable {
    let items: [CyberUnionPlayer]
    let total: Int
}
```

### 3.4 Новые API-методы (APIService.swift)
```swift
// GET /api/public/cyberunion/teams?game=cs2&page=1&limit=20
func getCyberUnionTeams(game: String, page: Int, limit: Int) async throws -> CyberUnionTeamsResponse

// GET /api/public/cyberunion/players?game=cs2&page=1&limit=20
func getCyberUnionPlayers(game: String, page: Int, limit: Int) async throws -> CyberUnionPlayersResponse

// GET /api/public/cyberunion/team-players?game=cs2&team_name=TeamName
func getCyberUnionTeamPlayers(game: String, teamName: String) async throws -> [CyberUnionTeamPlayer]
```

---

## 4. Изменения в существующих экранах

### 4.1 MainTabView.swift
- Заменить вкладку "Трансфер" (иконка `arrow.left.arrow.right`) на "Рейтинги" (иконка `chart.bar`)
- Содержимое: `RatingsHubView()` вместо `TransferView()`

### 4.2 ProfileView.swift
- Добавить `NavigationLink(destination: TransferView())` в список кнопок профиля
- Расположение: между "Мои бронирования" и "Настройки"
- Иконка: `arrow.left.arrow.right`

### 4.3 HomeView.swift — Fix club tap
- Заменить `NavigationLink(destination:)` на `NavigationLink(value:)` + `.navigationDestination`

### 4.4 TournamentsView.swift
- Убрать секцию "Рейтинги по играм" (теперь в отдельной вкладке)
- Оставить только список турниров

### 4.5 TournamentDetailView.swift
- Убрать `NavigationLink` на `TournamentGameRatingView`

---

## 5. Файлы к удалению / архивированию

- `Views/Ratings/RatingsView.swift` — заменяется на `RatingsHubView.swift`
- `Views/Tournaments/TournamentGameRatingView.swift` — логика переходит в `CyberUnionView`

---

## 6. Порядок реализации

1. Исправить баги (тап клуб, турниры) — быстрая проверка и fix
2. Создать `CyberUnion.swift` модели
3. Добавить API методы в `APIService.swift`
4. Создать `CyberUnionView.swift`
5. Создать `RatingsHubView.swift`
6. Обновить `MainTabView.swift` (вкладка Рейтинги)
7. Обновить `ProfileView.swift` (добавить Трансфер)
8. Обновить `TournamentsView.swift` (убрать game ratings секцию)
9. Обновить `TournamentDetailView.swift`
10. Удалить устаревшие файлы
11. Обновить `project.pbxproj` (новые файлы, удалённые файлы)
12. Коммит и пуш

---

## 7. Не входит в скоуп

- Редизайн существующих экранов (цвета, типографика уже совпадают с вебом)
- Admin panels
- Онбординг / туториал
