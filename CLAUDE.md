# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Docker (production / full stack)
```bash
docker-compose up -d --build   # собрать и поднять все сервисы
docker-compose up -d            # поднять без пересборки (pull образов)
docker-compose logs -f backend  # логи конкретного сервиса
docker-compose down             # остановить
```

### Backend (локальная разработка)
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
export CONFIG_DIR=$(pwd)/data
mkdir -p data
python app.py                   # запуск на http://localhost:5000
```

### Frontend — cp.icafedash.com (`frontend/icafedash-main`)
```bash
cd frontend/icafedash-main
npm install --legacy-peer-deps
npm run dev        # dev-сервер
npm run build      # production сборка
npm run lint       # ESLint
npm run test       # vitest (однократно)
npm run test:watch # vitest watch
```

### Club-Finder — cloud.icafedash.com (`club-finder`)
```bash
cd club-finder
npm install --legacy-peer-deps
npm run dev
npm run build
npm run test
```

### Showcase — icafedash.com (`showcase`)
```bash
cd showcase
npm install --legacy-peer-deps
npm run dev
npm run build
```

## Architecture

### Services
| Сервис | Порт | Код |
|--------|------|-----|
| Flask backend | 5000 | `backend/app.py` (единственный файл ~5600 строк) |
| MySQL 8.0 | 3306 | volume `icafe_db_data` |
| frontend (cp) | nginx:80 | `frontend/icafedash-main/` |
| clubfinder | nginx:80 | `club-finder/` |
| showcase | nginx:80 | `showcase/` |
| Caddy | 80/443 | `Caddyfile` — reverse proxy + auto-SSL |

Все три nginx-контейнера проксируют `/api/*` → `backend:5000`. В dev-режиме Vite используют `VITE_API_URL` (по умолчанию `/api`).

### Backend (`backend/app.py`)
Монолитный Flask-файл. Структура:
1. **Инициализация** (строки 1–160): Flask app, CORS, JWT (2ч TTL), SQLAlchemy, Bcrypt, SMTP, FACEIT credentials
2. **Модели** (163–396): Club, User, EmailVerification, ClubReview, BookingRequest, CashbackTransaction, Team/TeamMember, Tournament/TournamentRegistration/TournamentMatch, TransferListing, Banner
3. **Утилиты** (623–1230): `load_config/save_config` (читают `CONFIG_DIR/config.json`), `icafe_get/post_for_club` (HTTP-клиент iCafeCloud API с параллелизацией), парсеры дат и статусов
4. **API-маршруты** (1232–5607)

**Группы API:**
- `/api/auth/*` — регистрация (OTP email), логин, FACEIT OAuth (popup + redirect flow)
- `/api/clients/*` — клиентские аккаунты (отдельный user-тип)
- `/api/admin/*` — CRUD клубов, пользователей, турниров, команд, баннеров, трансферов
- `/api/captain/*` — управление командой капитаном
- `/api/public/*` — публичный каталог, турниры, трансфер, FACEIT-профили, бронирование, кешбэк
- `/api/overview`, `/api/pcs`, `/api/members`, `/api/charts/*`, `/api/billing-logs` — дашборд менеджера (требует JWT + привязанный Club)
- `/api/bookings/*` — внутреннее управление бронированием
- `/api/cashback/*` — конфигурация и транзакции кешбэка
- `/api/config`, `/api/config/icafe-data` — настройки платформы
- `GET /` → отдаёт SPA (`frontend/icafedash-main/dist`)

**Роли JWT:** поле `role` = `"admin"` | `"manager"` | `"client"`. Менеджер видит только свой клуб (по FK `user.club_id`). Декоратор `admin_required` проверяет роль.

**Внешние API:**
- iCafeCloud `https://api.icafecloud.com/api/v2` — авторизация по `api_key` + `cafe_id`, хранятся в модели Club
- FACEIT Data API v4 + OAuth (ключи в env)

**Конфиг:** `CONFIG_DIR/config.json` — настройки платформы (не относящиеся к БД). В Docker это volume `icafe_data:/app/data`.

### Frontend — cp.icafedash.com (`frontend/icafedash-main/src`)
SPA с двумя маршрутами: `/login` и `/` (Index). Вся логика в `pages/Index.tsx`, который рендерит либо `AdminDashboard`, либо `ManagerHyperOverview` в зависимости от роли. API-вызовы централизованы в `src/lib/api.ts` (axios-обёртка с JWT из localStorage).

### Club-Finder — cloud.icafedash.com (`club-finder/src`)
Mobile-first PWA (max-width 420px, брендинг FRAG.GG). Состояние авторизации — `AuthProvider` (`components/auth/AuthProvider.tsx`), защита — `AuthGuard`. Хуки (`src/hooks/use-*.ts`) инкапсулируют все API-запросы через `@tanstack/react-query`. Геосортировка клубов — `src/lib/distance.ts`. Карта — Leaflet (`react-leaflet`).

### Showcase (`showcase/src`)
Статический лендинг + страница регистрации. Без авторизации.

## Key conventions

- **БД**: SQLAlchemy + `db.create_all()` при старте — миграций нет, схема воссоздаётся автоматически. Для сброса данных — удалить volume `icafe_db_data`.
- **Загрузки**: файлы хранятся в `CONFIG_DIR/uploads/`, раздаются через `/api/uploads/<filename>`.
- **Тесты**: `test_api.py` в корне — ручные smoke-тесты HTTP. Unit-тесты фронтендов в `src/test/`.
- **npm install**: все фронтенды требуют `--legacy-peer-deps` из-за конфликтов зависимостей.
- **Docker образы**: публикуются под `ngixsystem/icafedash-{backend,frontend,showcase,clubfinder}:latest`. Локальная сборка через `--build` в docker-compose.
