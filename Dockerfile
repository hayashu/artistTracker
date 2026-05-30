# syntax=docker/dockerfile:1.7

FROM node:24-bookworm-slim AS dev

WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

RUN --mount=type=cache,target=/root/.npm npm ci --prefer-offline --no-audit --fund=false

COPY . .

EXPOSE 3003 3004

CMD ["npm", "run", "dev"]
