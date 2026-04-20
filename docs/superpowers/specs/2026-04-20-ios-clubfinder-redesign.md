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

1. Добавить цветовую палитру и шрифт Oswald в `Theme.swift` / `AppConstants.swift`
2. Исправить баг тап по клубу — `NavigationLink(value:)` + `.navigationDestination`
3. Исправить турниры — выровнять модель `PublicTournament` с реальным API
4. Создать `CyberUnion.swift` модели
5. Добавить API методы в `APIService.swift`
6. Создать `CyberUnionView.swift` (дизайн 1:1)
7. Создать `RatingsHubView.swift` (дизайн 1:1)
8. Обновить `MainTabView.swift` — вкладка Рейтинги, иконки и цвета 1:1
9. Обновить `ProfileView.swift` — меню с Transfer, дизайн строк 1:1
10. Редизайн `HomeView.swift` — карточки клубов, search bar, цвета
11. Редизайн `ClubDetailView.swift` — Oswald заголовок, цвета секций
12. Редизайн `TournamentsView.swift` — карточки с gradient border, убрать game ratings
13. Обновить `TournamentDetailView.swift` — убрать ссылку на TournamentGameRatingView
14. Удалить `RatingsView.swift` и `TournamentGameRatingView.swift`
15. Обновить `project.pbxproj` (новые файлы, удалённые файлы)
16. Коммит и пуш

---

## 7. Дизайн-система — 1:1 с вебом

Все экраны должны точно соответствовать веб-версии по цветам, иконкам, типографике и компоновке.

### 7.1 Цветовая палитра
```swift
// Backgrounds
bgPrimary      = #0B0D12   // основной фон приложения
bgCard         = #1E1F22   // карточки клубов, турниров
bgInput        = #1a1b1f   // инпуты, строки списка
bgSecondary    = #121315   // вторичный фон (секции внутри страниц)

// Borders
borderDefault  = #2F3136   // все границы карточек и секций

// Accent
accentOrange   = #FF7800   // активный таб, кнопки, хайлайты
accentPurple   = #7C3AED   // Transfer карточка в хабе

// Text
textPrimary    = #FFFFFF
textSecondary  = #a5adba   // неактивные табы, подписи
textMuted      = #949BA4   // заголовки секций (uppercase)

// Status
statusOpen     = #57F287   // онлайн-индикатор клуба
statusClosed   = #ED4245   // закрыт

// Rank colors
rankGold       = #FEE75C   // #1
rankSilver     = #C0C0C0   // #2
rankBronze     = #CD7F32   // #3
```

### 7.2 Типографика
- **Display (названия клубов, заголовки экранов):** шрифт Oswald, Bold, uppercase
  - Загрузить через Google Fonts или встроить TTF в bundle
  - Название клуба в ClubDetailView: Oswald 32px Bold uppercase
  - Заголовки навигационных экранов: Oswald 20px Bold
- **Body / UI:** системный шрифт SF Pro (`.body`, `.caption`, `.headline`) — без изменений

### 7.3 Bottom Navigation Bar
```
Высота: 60px
Фон: #0B0D12
Верхняя граница: 1px #2F3136
Активный цвет: #FF7800
Неактивный цвет: #a5adba
```

**Иконки (lucide → SF Symbols):**
| Вкладка    | Lucide (веб) | SF Symbol (iOS)         |
|------------|-------------|-------------------------|
| Клубы      | Home        | `house`                 |
| Карта      | Map         | `map`                   |
| Турниры    | Trophy      | `trophy`                |
| Рейтинги   | BarChart2   | `chart.bar.xaxis`       |
| Профиль    | User        | `person`                |

### 7.4 HomeView (список клубов)
- Фон экрана: `#0B0D12`
- Поле поиска: фон `#1E1F22`, граница `#2F3136`, иконка `magnifyingglass` цвет `#a5adba`
- **Карточка клуба:**
  - Фон: `#1E1F22`, граница `#2F3136`, радиус 12px
  - Название: Oswald Bold uppercase, белый
  - Статус-бейдж: точка 8px + текст; open=`#57F287`, closed=`#ED4245`; анимация pulse для "открыт"
  - Capacity bar: фон `#272727`, градиент заполнения зелёный→жёлтый→красный в зависимости от загрузки
  - Расстояние: иконка `location.fill` + текст `#a5adba`

### 7.5 ClubDetailView
- Заголовок клуба: Oswald 32px Bold uppercase
- Секции: `#1E1F22` фон с `#2F3136` границей
- Кнопка "Забронировать": фон `#FF7800`, текст белый, full-width, радиус 12px
- Теги/фичи: `#2F3136` фон, `#a5adba` текст

### 7.6 TournamentsView
- Фон: `#0B0D12`
- **Карточка турнира:**
  - Фон: `#0D0E12`
  - Граница с градиентом: `from-[#FF7800]/30` (30% оранжевый → прозрачный)
  - Hover/press эффект: scale 1.02 + тень `rgba(255,120,0,0.15)`
  - Статус-бейдж: "Активный"=зелёный, "Скоро"=синий, "Завершён"=серый
- Статус-фильтр (Picker): сегментированный, цвета аналогично веб

### 7.7 RatingsHubView
- Фон: `#0B0D12`
- Секция-заголовки: uppercase `#949BA4` 11px letter-spacing
- **Карточки навигации:**
  - CYBER UNION CS2: иконка-квадрат `#FF7800` фон, SF Symbol `gamecontroller`, текст "CS2", подпись "Команды и игроки"
  - CYBER UNION PUBG: иконка-квадрат `#FF7800` фон, SF Symbol `iphone`, текст "PUBG Mobile"
  - FACEIT UZ: иконка-квадрат `#FF6309` фон, SF Symbol `crown`, текст "FACEIT Uzbekistan", подпись "Топ-100 CS2"
  - Transfer: иконка-квадрат `#7C3AED` фон, SF Symbol `arrow.left.arrow.right`, текст "Трансфер маркет", подпись "LFT / LFS"
- Разделители между секциями: 1px `#2F3136`
- Стрелка `›` справа каждой строки: `#a5adba`

### 7.8 CyberUnionView
- Заголовок: Oswald Bold uppercase — "CYBER UNION CS2" / "CYBER UNION PUBG MOBILE"
- Picker (Команды/Игроки): сегментированный, активный `#FF7800` фон белый текст
- **Строка команды:**
  - Rank: `#FEE75C`/#1, `#C0C0C0`/#2, `#CD7F32`/#3, `#a5adba` остальные; ширина 28px
  - Лого: AsyncImage, 32×32px, радиус 6px, фон `#2F3136` placeholder
  - Название: белый Bold
  - WINS: `#FF7800` Bold + подпись "WINS" `#a5adba` 10px
  - Шеврон `chevron.right`: `#a5adba`, поворачивается при раскрытии
- **Состав команды (expandable):** список игроков с аватаром 24px + ник + faceit elo/level badge
- **Строка игрока:** аналогично команде (rank + аватар + ник + faceit badge + wins)
- **Кнопка "Загрузить ещё":** текст `#FF7800`, нижний отступ 16px

### 7.9 ProfileView
- Аватар: круг 80px, фон `#2F3136` placeholder
- Имя пользователя: Oswald Bold 20px
- **Строки меню:**
  - Фон `#1E1F22`, граница `#2F3136`, радиус 10px
  - Иконка SF Symbol в квадрате 36px (оранжевый фон `#FF7800`)
  - Стрелка `chevron.right` справа
  - Порядок: Кэшбэк → Мои бронирования → Трансфер маркет → Настройки → Выйти
  - "Выйти": иконка `rectangle.portrait.and.arrow.right`, красный текст `#ef4444`

### 7.10 FaceitLevelBadge
Переиспользуемый компонент (уже используется, выровнять с вебом):
- Уровень 1-4: серый `#808080`
- Уровень 5-7: жёлтый `#FFC500`
- Уровень 8-9: оранжевый `#FF6500`
- Уровень 10: красный `#FF0000`
- Размер бейджа: 20×20px + текст elo рядом `#a5adba`

---

## 8. Не входит в скоуп

- Admin panels
- Онбординг / туториал
- iPad layout
