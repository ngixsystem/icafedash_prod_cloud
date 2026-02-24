# ── Backend Dockerfile ────────────────────────────────────────────────────────
# Python 3.11 slim — runs Flask on port 5000
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Config persists inside a named volume mounted at /app/data
ENV CONFIG_DIR=/app/data
RUN mkdir -p /app/data

EXPOSE 5000

CMD ["python", "app.py"]
