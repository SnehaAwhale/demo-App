# --- Frontend build stage ---
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# Same-origin in production: Flask serves both the API and the built
# frontend, so a relative path works regardless of the deployed domain.
ENV VITE_API_BASE_URL=/api
RUN npm run build

# --- Backend runtime stage ---
FROM python:3.12-slim
WORKDIR /app/backend

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

ENV FLASK_ENV=production
EXPOSE 8080
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-8080} run:app"]
