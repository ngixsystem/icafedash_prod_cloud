# ── Club-Finder Dockerfile (multi-stage) ───────────────────────────────────
# Stage 1: build React/Vite app with Node.js
FROM node:20-alpine AS builder

WORKDIR /app

# Copy all source files
COPY . .

# Install dependencies
RUN npm install --legacy-peer-deps

# API is proxied by nginx on the same origin (same as frontend)
ENV VITE_API_URL=/api
RUN npm run build

# Stage 2: serve built files with nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# nginx config: proxy /api/* → backend:5000
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
