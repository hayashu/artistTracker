# Artist Tracker

音楽アーティストの世界中のライブイベントを、インタラクティブな 3D グローブ / 2D マップ上に可視化する Web アプリケーション。

---

## 機能一覧

### 検索・サジェスト
- アーティスト名検索（Ticketmaster Discovery API v2）
- **スペル補正**：Levenshtein 距離を用いた編集距離計算により、タイプミスを自動補正
- **インクリメンタルサジェスト**：2文字以上で DB 内の既知アーティストをリアルタイム候補表示（類似度 0.7 以上・前方一致優先・名前長でソート）

### キャッシュ・永続化
- **Redis キャッシュ**：アーティスト検索結果（TTL 7日）・イベント一覧（TTL 3時間）をキャッシュし API コールを削減
- **PostgreSQL 永続化**：検索済みアーティスト・会場・イベントを Prisma ORM で upsert

### 地図表示
- **3D グローブ**（react-globe.gl）と **2D マップ**（react-map-gl + MapLibre GL）の切り替え
- Google Maps 風 SVG ピンでイベント会場を表示
- ピンクリックでイベント詳細パネルを表示
- **Tour 機能**：全ピンを3秒ごとに自動巡回

### タイムゾーン
- アクセス元の IP アドレスから国・タイムゾーンを自動検出（ip-api.com）
- **現地時間 / ユーザー時間** を並べて表示
- 右上セレクタから13地域のタイムゾーンへ手動切替

### UI / UX
- Artist・Event パネルの境界をドラッグでリサイズ
- 遠征プラン（Google Maps 経路・楽天トラベル・Booking.com リンク）
- 前後3日以内の近接イベント表示

### 状態の永続化（localStorage）
リロード後も以下の状態を復元：

| 項目 | キー |
|------|------|
| 表示モード（3D/2D） | `viewMode` |
| タイムゾーン選択 | `timezone` |
| サイドバー高さ | `artistPanelHeight` |
| 最終検索キーワード | `lastKeyword` |
| 選択アーティスト | `lastArtistId` |
| 選択イベント | `lastEventId` |
| 地球儀カメラ位置 | `globePov` |

---

## アーキテクチャ

```
ブラウザ (Next.js) ──→ Express (:3001) ──→ Redis (:6379)
                                          ↕
                                      PostgreSQL
                                          ↕
                                   Ticketmaster API
```

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js 15 (App Router) + TypeScript |
| バックエンド | Express.js + TypeScript |
| キャッシュ | Redis + ioredis |
| データベース | PostgreSQL + Prisma ORM |
| 3D グローブ | react-globe.gl (Three.js) |
| 2D マップ | react-map-gl + MapLibre GL |
| セッション | express-session + connect-redis |

---

## セットアップ

### 前提条件
- Node.js v18 以上
- Redis サーバー
- PostgreSQL サーバー
- Ticketmaster API キー

### Docker で Redis / PostgreSQL を起動

```bash
docker run -d -p 6379:6379 redis:alpine
docker run -d -p 5432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=artist_tracker \
  postgres:16-alpine
```

### 環境変数

`backend/.env`

```env
TICKETMASTER_API_KEY=your_key
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/artist_tracker
REDIS_URL=redis://localhost:6379
SESSION_SECRET=your_random_secret
PORT=3001
ALLOWED_ORIGIN=http://localhost:3000
```

`frontend/.env.local`

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### 起動

```bash
npm install
cd backend && npx prisma migrate deploy && cd ..
npm run dev
```

http://localhost:3000 をブラウザで開く。
