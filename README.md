# 🚀 iCafeDash Platform - Multi-tenant Gaming Club Management

A high-performance, multi-tenant SaaS platform for gaming lounge owners. Manage multiple clubs, assign managers, and monitor real-time metrics with a unified administrative interface.

![iCafeDash Platform](https://via.placeholder.com/1200x600?text=iCafeDash+Multi-tenant+Platform)

## ✨ Platform Features

- **🏢 Multi-tenancy**: Host multiple clubs on a single platform with strict data isolation.
- **� JWT Authentication**: Secure, sessionless authentication for admins and club managers.
- **� Admin Panel**: Centralized control to add new clubs (via API Keys) and create manager accounts.
- **📊 Dynamic Dashboards**: Role-based access—managers see their specific club; admins see the entire platform.
- **� Branding & Customization**: Each club can have its own name, logo, and settings.
- **🐳 Enterprise Docker Stack**: Powered by MySQL 8.0 for persistent, structured data storage.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Recharts, TanStack Query.
- **Backend**: Flask (Python), SQLAlchemy ORM, Flask-JWT-Extended, Flask-Bcrypt.
- **Database**: MySQL 8.0.
- **Infrastructure**: Docker Compose, Nginx (ready).

---

## 🚀 Deployment Guide (Docker)

### 1. Requirements
Ensure you have **Docker** and **Docker Compose** installed.

### 2. Configure Environment
The platform requires a database connection and a JWT secret. These are pre-configured in `docker-compose.yml`. 

### 3. Launch
```bash
docker-compose up -d --build
```

### 4. Initial Login
Once the stack is up, you can log in at `http://localhost/login` using the default administrator credentials:
- **Username**: `admin`
- **Password**: `admin123`

> [!IMPORTANT]
> **Change your password immediately** after the first login via the Admin Panel or Database.

---

## 🏗️ Platform Management

1. **Adding a Club**: In the "Админка" (Admin) tab, enter the club's name, iCafeCloud Cafe ID, and API Key.
2. **Creating Managers**: Assign a username and password to a manager and link them to a specific club.
3. **Data Isolation**: Log in with a manager account to see only the dashboard for the assigned club.

## ⚙️ Development & Local Setup

### Backend (Flask + MySQL)
1. Install dependencies: `pip install -r backend/requirements.txt`
2. Set environment variables: `DATABASE_URL`, `JWT_SECRET_KEY`.
3. Run: `python backend/app.py`

### Frontend (Vite)
1. Install: `npm install` inside `frontend/icafedash-main/`
2. Run: `npm run dev`

---

## 🔒 Security & Best Practices

- **DB Encryption**: All manager passwords are hashed using **Bcrypt**.
- **Stateless Session**: JWT tokens are used for all API requests.
- **Context-Aware API**: The backend dynamically fetches iCafeCloud data based on the authenticated user's club identity.

---

## 📄 License

This project is licensed under the MIT License.
