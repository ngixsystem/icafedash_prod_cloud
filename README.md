# 🚀 iCafeDash - iCafeCloud Admin Dashboard

A modern, powerful, and visually stunning web dashboard for administrators using **iCafeCloud**. Monitor your gaming club's health, analyze revenue trends, and manage members in real-time.

![iCafeDash Preview](https://via.placeholder.com/1200x600?text=iCafeDash+Modern+Gaming+Dashboard)

## ✨ Features

- **📊 Advanced Analytics**: Interactive bar charts for monthly and daily revenue trends.
- **🖥️ Real-time Monitoring**: Track PC status (active, busy, locked) with direct integration to iCafeCloud API.
- **👤 Member Management**: Searchable database of club participants with balance tracking and loyalty points status.
- **🎨 Custom Branding**: White-label support. Upload your own logo and change the club name directly from the UI.
- **🌑 Dark Mode Aesthetic**: Premium glassmorphism design optimized for high-end gaming lounges.
- **🐳 Docker Ready**: Deployment-ready containers with automated Nginx proxying and persistent storage.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Recharts, Lucide Icons, TanStack Query.
- **Backend**: Flask (Python), Requests (for API proxying), CORS.
- **Deployment**: Docker, Docker Compose, Nginx.

---

## 🚀 Quick Start (Docker - Recommended)

The easiest way to get iCafeDash running is using Docker Compose.

### 1. Clone the repository
```bash
git clone https://github.com/ngixsystem/icafedash.git
cd icafedash
```

### 2. Configure Credentials
Edit the `docker-compose.yml` file and set your iCafeCloud credentials in the `backend` service environment variables:

```yaml
environment:
  - ICAFE_API_KEY=your_key_here
  - ICAFE_CAFE_ID=your_id_here
```

### 3. Start the stack
```bash
docker-compose up -d --build
```
The dashboard will be available at **`http://localhost`**.

---

## 💻 Local Development

If you want to run the project without Docker:

### Backend Setup
1. Navigate to `backend/`
2. Create a virtual environment: `python -m venv venv`
3. Activate it: `source venv/bin/activate` (or `.\venv\Scripts\activate` on Windows)
4. Install dependencies: `pip install -r requirements.txt`
5. Run the server: `python app.py` (Runs on port 5000)

### Frontend Setup
1. Navigate to `frontend/icafedash-main/`
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`

---

## ⚙️ Configuration & Persistence

- **API Keys**: Can be set via environment variables in Docker or manually in `backend/config.json`.
- **Persistence**: When using Docker, configuration and uploaded logos are stored in a named volume (`icafe_data`), so they survive container restarts.
- **Branding**: Change your club name and upload a logo in the **Settings** menu within the dashboard.

## 🔒 Security

- Sensitive credentials like the API Key and Cafe ID are set as **read-only** in the web interface to prevent unauthorized changes once deployed.
- Ensure your server's Public IP is whitelisted in the [iCafeCloud Admin Panel](https://api.icafecloud.com).

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to help improve the dashboard for everyone.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
