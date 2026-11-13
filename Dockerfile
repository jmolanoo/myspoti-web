# Stage 1: Build the frontend PWA
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production runtime
FROM node:20-slim
WORKDIR /app

# Install system dependencies: python3, pip, ffmpeg, curl, build tools for sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp for full audio stream resolution
RUN pip3 install --no-cache-dir --break-system-packages yt-dlp

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/myspoti_local.db

COPY package*.json ./
RUN npm install --omit=dev

COPY src/ ./src/
COPY docs/ ./docs/
COPY public/ ./public/
COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/data

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "src/server/index.js"]
