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
ブラウザ (Next.js :3003) ──→ Express (:3004) ──→ Redis (:6379)
                                          ↕
                                  PostgreSQL (:5432)
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
- Docker / Docker Compose
- Ticketmaster API キー

### Ticketmaster API キーの取得

1. [Ticketmaster Developer Portal](https://developer.ticketmaster.com/) にアクセスします。
2. アカウントを作成、またはログインします。
3. 上タブの"My Apps"より"Add New Application"をクリックし、Appを作成します。
4. 作成後、表示される `Consumer Key` を確認します。
5. この `Consumer Key` を、このアプリでは `TICKETMASTER_API_KEY` として使います。

Ticketmaster Discovery API では、API キーを `apikey` クエリパラメータとして渡します。

```text
https://app.ticketmaster.com/discovery/v2/events.json?apikey=YOUR_API_KEY
```

このプロジェクトでは API キーをコードに直接書かず、`backend/.env` に保存します。

```env
TICKETMASTER_API_KEY=your_ticketmaster_api_key
```

このアプリで主に使う Ticketmaster API は以下です。

| 用途 | エンドポイント |
| --- | --- |
| アーティスト検索 | `GET /discovery/v2/attractions.json` |
| イベント検索 | `GET /discovery/v2/events.json` |

参考:
- [Ticketmaster Developer Portal](https://developer.ticketmaster.com/)
- [Discovery API v2 Documentation](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/)

### Docker Compose で起動

`backend/.env` を作成します。Docker 内の `DATABASE_URL` / `REDIS_URL` / `PORT` は `docker-compose.yml` 側で上書きするため、ローカル実行用の値が入っていても構いません。

```env
TICKETMASTER_API_KEY=your_key
SESSION_SECRET=your_random_secret
IPINFO_TOKEN=optional
```

`frontend/.env.local` を作成します。

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3004
```

起動:

```bash
npm run docker:up
```

以下の URL でアクセスします。

```text
Frontend: http://localhost:3003
Backend:  http://localhost:3004
Postgres: Docker 内部ネットワークの postgres:5432
Redis:    Docker 内部ネットワークの redis:6379
```

停止:

```bash
npm run docker:down
```

ログ確認:

```bash
npm run docker:logs
```

### ローカルで直接起動する場合

Docker を使わずに起動する場合は、Node.js v18 以上、Redis、PostgreSQL を別途用意します。

`backend/.env`

```env
TICKETMASTER_API_KEY=your_key
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/artist_tracker
REDIS_URL=redis://localhost:6379
SESSION_SECRET=your_random_secret
PORT=3004
ALLOWED_ORIGIN=http://localhost:3003
```

`frontend/.env.local`

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3004
```

起動:

```bash
npm install
cd backend && npx prisma migrate deploy && cd ..
npm run dev
```

http://localhost:3003 をブラウザで開く。
