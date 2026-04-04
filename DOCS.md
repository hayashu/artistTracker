# Artist Tracker - アプリケーション解説ドキュメント

## 概要

Artist Tracker は、音楽アーティストの今後のライブイベントを **インタラクティブな3Dグローブ / 2Dマップ** 上にピンとして可視化する Web アプリケーションです。Ticketmaster Discovery API v2 からリアルタイムにデータを取得し、会場の緯度経度をもとにマップ上にプロットします。

---

## アーキテクチャ

```
ブラウザ (React) ──→ Next.js (:3000) ──→ Express (:3001) ──→ Redis (:6379)
                     フロントエンド           バックエンド       ↕  キャッシュ層
                                                              ↕
                                                         PostgreSQL
                                                          永続化層
                                                              ↕
                                                      Ticketmaster API
                                                           外部API
```

- **フロントエンド** が直接 Ticketmaster API を呼ぶことはありません
- **バックエンド** が API キーを保持し、プロキシとして機能します
- **Redis** がキャッシュ層として機能し、同一リクエストの API 呼び出しを抑制します
- **PostgreSQL** が検索済みアーティスト・イベントを永続化します
- npm workspaces によるモノレポ構成で、`concurrently` により両サーバーを同時起動します

---

## 技術スタック

| レイヤー | 技術 | 役割 |
|---------|------|------|
| バックエンド | Express.js + TypeScript | API プロキシ、データ正規化 |
| フロントエンド | Next.js 15 (App Router) + TypeScript | UI レンダリング |
| キャッシュ | Redis + ioredis | TTL付きAPIレスポンスキャッシュ |
| データベース | PostgreSQL + Prisma ORM | アーティスト・イベントの永続化 |
| 3D グローブ | `react-globe.gl` (Three.js ベース) | 地球儀上のイベント可視化 |
| 2D マップ | `react-map-gl` + `maplibre-gl` | フラットマップ上のイベント可視化 |
| スタイリング | CSS Modules | コンポーネントスコープ付き CSS |
| モノレポ管理 | npm workspaces + concurrently | ワークスペース管理・同時起動 |

---

## プロジェクト構造

```
artist-tracker/
├── package.json                        # ワークスペース定義・起動スクリプト
├── .gitignore
│
├── backend/                            # Express バックエンド
│   ├── .env                            # APIキー等の環境変数
│   ├── prisma/
│   │   └── schema.prisma               # DBスキーマ定義 (Artist / Venue / Event)
│   └── src/
│       ├── index.ts                    # サーバーエントリポイント
│       ├── config/index.ts             # 環境変数管理
│       ├── lib/prisma.ts               # Prismaクライアントのシングルトン
│       ├── types/ticketmaster.ts       # Ticketmaster 生レスポンス型 + 正規化型
│       ├── services/ticketmaster.ts    # API呼び出し + Redisキャッシュ + 正規化ロジック
│       ├── db/
│       │   ├── artists.ts              # Artist upsert
│       │   ├── venues.ts               # Venue upsert
│       │   └── events.ts               # Event upsert
│       ├── utils/
│       │   └── redis-client.ts         # ioredis クライアント初期化
│       └── routes/
│           ├── artists.ts              # GET /api/artists
│           └── events.ts               # GET /api/events
│
└── frontend/                           # Next.js フロントエンド
    ├── .env.local                      # バックエンドURL
    ├── next.config.ts                  # Three.js transpile、画像ドメイン許可
    └── src/
        ├── app/
        │   ├── layout.tsx              # ルートレイアウト
        │   ├── page.tsx                # メインページ（全コンポーネント統合）
        │   ├── globals.css             # CSS変数・リセット・maplibre CSS
        │   └── page.module.css         # メインページレイアウト
        ├── components/
        │   ├── SearchBar.tsx           # 検索入力フォーム
        │   ├── ArtistCard.tsx          # アーティスト情報カード
        │   ├── EventList.tsx           # イベント一覧リスト
        │   ├── EventDetail.tsx         # イベント詳細パネル
        │   ├── ViewToggle.tsx          # 3D/2D 切り替えボタン
        │   ├── globe/
        │   │   ├── GlobeWrapper.tsx    # react-globe.gl のラッパー（内部）
        │   │   └── GlobeView.tsx       # SSR回避 dynamic import（外部）
        │   └── map/
        │       └── MapView.tsx         # 2D MapLibre マップ
        ├── hooks/
        │   ├── useArtistSearch.ts      # アーティスト検索ロジック
        │   └── useArtistEvents.ts      # イベント取得 + MapPin 生成
        ├── types/index.ts              # フロントエンド型定義
        └── lib/api.ts                  # バックエンド呼び出しクライアント
```

---

## データフロー

アプリ全体のデータの流れを、ユーザー操作の順に解説します。

### 1. アーティスト検索

```
ユーザー入力 → SearchBar → useArtistSearch.search()
  → lib/api.ts: searchArtists(keyword)
    → GET http://localhost:3001/api/artists?keyword=...
      → backend/routes/artists.ts: バリデーション (2文字以上)
        → backend/services/ticketmaster.ts: searchArtists()
          → Redis: キャッシュ確認 (key: "artist:{keyword}", TTL: 7日)
            → CACHE HIT:  Redis から即返却
            → CACHE MISS: Ticketmaster API: /discovery/v2/attractions.json
                          → レスポンス正規化 (画像選択、ジャンル抽出)
                          → Redis に保存
        ← ArtistSearchResult[] を返却
        → PostgreSQL: Artist を upsert (存在すれば更新)
      ← { artists: [...] }
    ← フロントエンドに JSON 返却
  → artists ステートに格納
→ ArtistCard としてサイドバーに表示
```

### 2. イベント取得とピン生成

```
ArtistCard クリック → page.tsx: handleArtistClick()
  → useArtistEvents.fetchEvents(attractionId)
    → GET http://localhost:3001/api/events?attractionId=...
      → backend/services/ticketmaster.ts: getEventsByArtist()
        → Redis: キャッシュ確認 (key: "event:{attractionId}", TTL: 3時間)
          → CACHE HIT:  Redis から即返却
          → CACHE MISS: Ticketmaster API: /discovery/v2/events.json
                        → 会場の緯度経度を parseFloat() + バリデーション
                        → NormalizedEvent[] を返却
                        → Redis に保存
        → PostgreSQL: Venue + Event を upsert
      ← { events: [...], total: N, mappable: M }
    ← フロントエンドに JSON 返却
  → events ステートに格納
  → useMemo で events → MapPin[] 自動変換（座標ありのみ）
→ GlobeView / MapView にピンとして描画
→ EventList としてサイドバーに一覧表示
```

### 3. イベント選択とカメラ移動

```
EventList のイベントクリック or マップ上のピンクリック
  → setSelectedEventId(eventId)
  → selectedPinId が算出 ("pin-{eventId}")
  → GlobeView: useEffect で selectedPinId 変更を検知
    → globeRef.pointOfView({ lat, lng, altitude: 1.5 }, 1000)
    → カメラがアニメーション付きで該当ピンにフライ
  → EventDetail パネルがメインエリア右下に表示
```

---

## バックエンド詳細

### エンドポイント一覧

| メソッド | パス | パラメータ | 説明 |
|---------|------|----------|------|
| GET | `/health` | なし | ヘルスチェック |
| GET | `/api/artists` | `keyword` (必須、2文字以上) | アーティスト検索 |
| GET | `/api/events` | `attractionId` (必須、英数字) | イベント一覧取得 |

### Redisキャッシュ (`utils/redis-client.ts`, `services/ticketmaster.ts`)

| キー形式 | TTL | 対象 |
|---------|-----|------|
| `artist:{keyword}` | 7日 | アーティスト検索結果 |
| `event:{attractionId}` | 3時間 | イベント一覧 |

- Redis への接続失敗・エラー時はキャッシュをスキップして API を呼び出す（フォールバック）
- `lazyConnect: true` により起動時に即時接続せず、初回リクエスト時に接続

### データ永続化 (`db/`, `prisma/schema.prisma`)

Prisma ORM を使って PostgreSQL に保存します。すべての書き込みは `upsert` で冪等性を保ちます。

| モデル | 保存タイミング | 主なフィールド |
|-------|------------|-------------|
| `Artist` | アーティスト検索時 | id, name, imageUrl, genre, subGenre |
| `Venue` | イベント取得時 | id, name, city, country, lat, lng |
| `Event` | イベント取得時 | id, artistId, venueId, date, status, priceMin/Max |

`EventStatus` は Prisma の enum で管理: `onsale / offsale / canceled / postponed / rescheduled / unknown`

### データ正規化 (`services/ticketmaster.ts`)

Ticketmaster API のレスポンスは複雑なネスト構造を持つため、バックエンドで以下の正規化を行います:

- **画像選択**: 16:9 比率の画像を優先的に選択。なければ最大幅の画像を使用
- **緯度経度変換**: Ticketmaster は座標を **文字列** で返すため、`parseFloat()` で数値に変換。`NaN` チェックと範囲バリデーション（緯度: -90~90、経度: -180~180）を実施
- **会場情報のフラット化**: ネストされた会場データ (`_embedded.venues[0]`) を `NormalizedVenue` に変換
- **座標なしイベント**: `location: null` として返却。リスト表示はされるがマップにはプロットされない

### エラーハンドリング

| HTTP ステータス | 原因 | レスポンス例 |
|---------------|------|------------|
| 400 | パラメータ不正 | `{ "error": "keyword query parameter is required" }` |
| 401 | API キー無効 | `{ "error": "Invalid Ticketmaster API key" }` |
| 429 | レート制限超過 | `{ "error": "Rate limit exceeded..." }` |
| 500 | 内部エラー | `{ "error": "Internal server error" }` |

---

## フロントエンド詳細

### 状態管理

外部の状態管理ライブラリは使用せず、React の `useState` / `useCallback` / `useMemo` で管理しています。

| Hook | 管理する状態 | 説明 |
|------|------------|------|
| `useArtistSearch` | `artists`, `state`, `error` | 検索結果と検索ステート (`idle` / `loading` / `success` / `error`) |
| `useArtistEvents` | `events`, `pins`, `selectedEventId`, `state` | イベントデータ、ピン配列、選択状態 |

**ピン色とステータスの対応:**

| ステータス | 色 | 意味 |
|----------|-----|------|
| `onsale` | 緑 `#1db954` | チケット販売中 |
| `offsale` | 黄 `#f39c12` | 販売停止中 |
| `cancelled` | 赤 `#e74c3c` | キャンセル |
| `postponed` | 紫 `#9b59b6` | 延期 |

### コンポーネント解説

#### `SearchBar`
- Enter キーまたはボタンクリックで検索実行
- 2文字未満は送信不可（disabled）
- ローディング中はスピナー表示
- 入力テキストのクリアボタン付き

#### `ArtistCard`
- アーティスト画像（円形）、名前、ジャンル、今後のイベント数を表示
- 選択中はアクセントカラーの背景でハイライト
- 画像がない場合は音符アイコンのプレースホルダーを表示

#### `EventList`
- 全イベントの一覧をサイドバーに表示
- 各イベントに日付、ステータスバッジ（色付き）、会場名、都市を表示
- 座標なしイベントには禁止アイコンを表示
- ヘッダーに合計数とマップ上に表示可能な数を表示

#### `EventDetail`
- メインエリア右下に浮遊するパネルとして表示
- 日付・時刻、会場名・住所、価格帯、チケットリンクを含む
- 閉じるボタンで非表示

#### `ViewToggle`
- メインエリア右上に配置
- 「3D Globe」と「2D Map」の切り替えトグル

### 3D グローブ (`globe/`)

`react-globe.gl` は Three.js ベースのためサーバーサイドレンダリング（SSR）と互換性がありません。この問題を **2層パターン** で解決しています:

```
GlobeView.tsx (外部)
  └── dynamic(() => import('./GlobeWrapper'), { ssr: false })
        └── GlobeWrapper.tsx (内部)
              └── ReactGlobe (react-globe.gl)
```

- **`GlobeWrapper`**: `forwardRef` + `useImperativeHandle` で `pointOfView` メソッドを外部に公開。NASA Blue Marble テクスチャを使用した地球儀、ピンのホバーツールチップ、選択中ピンの拡大表示を実装
- **`GlobeView`**: `next/dynamic` の `ssr: false` で SSR を回避。`selectedPinId` の変更を監視し、`pointOfView` でカメラをアニメーション移動。ローディングフォールバックを表示
- **`ResizeObserver`**: `react-globe.gl` は明示的なピクセルサイズ（`width` / `height`）が必要なため、メインページでコンテナの実サイズを計測して渡す

### 2D マップ (`map/`)

- `react-map-gl/maplibre` + CARTO Dark Matter タイルを使用（API キー不要）
- `<Marker>` でピンを描画、クリックで `<Popup>` を表示
- `<NavigationControl>` でズーム/回転コントロール
- `selectedPinId` 変更時に `viewState` を更新してカメラ移動

---

## スタイリング方針

### CSS Modules
各コンポーネントに `ComponentName.module.css` ファイルを配置し、クラス名がコンポーネントスコープに閉じるようにしています。

```tsx
import styles from './SearchBar.module.css';
// <div className={styles.form}> → .SearchBar_form__xxxx
```

### CSS 変数 (`globals.css`)
Spotify 風ダークテーマのカラーパレットを CSS カスタムプロパティとして定義:

| 変数名 | 値 | 用途 |
|-------|-----|------|
| `--bg-primary` | `#121212` | メイン背景 |
| `--bg-secondary` | `#1e1e1e` | サイドバー・パネル背景 |
| `--bg-tertiary` | `#2a2a2a` | 入力欄・ホバー背景 |
| `--text-primary` | `#ffffff` | メインテキスト |
| `--text-secondary` | `#b3b3b3` | 補助テキスト |
| `--text-muted` | `#6a6a6a` | 薄いテキスト |
| `--accent` | `#1db954` | アクセントカラー（Spotify グリーン） |
| `--border` | `#333333` | ボーダー |
| `--sidebar-width` | `360px` | サイドバー幅 |

### レイアウト構成

```
┌──────────────────────────────────────────────────┐
│ [Sidebar: 360px]  │ [Main: 残り全幅]              │
│                   │                               │
│  Logo             │              [ViewToggle]      │
│  SearchBar        │                               │
│  ArtistCards      │     3D Globe / 2D Map         │
│  ──────────       │                               │
│  EventList        │                               │
│                   │              [EventDetail]     │
└──────────────────────────────────────────────────┘
```

- `display: flex; height: 100vh` で全画面レイアウト
- サイドバーは固定幅、メインエリアは `flex: 1` で残りを占有

---

## セットアップ手順

### 前提条件
- Node.js v18 以上
- Ticketmaster API キー ([developer.ticketmaster.com](https://developer.ticketmaster.com/) で取得)
- Redis サーバー（ローカルまたは Docker）
- PostgreSQL サーバー（ローカルまたは Docker）

### 手順

```bash
# 1. プロジェクトディレクトリに移動
cd ~/Desktop/artist-tracker

# 2. 環境変数を設定
# backend/.env の各変数を記入（下記「環境変数」セクション参照）

# 3. 依存関係インストール (ルートから一括)
npm install

# 4. DBマイグレーション
cd backend && npx prisma migrate deploy && cd ..

# 5. 開発サーバー起動 (バックエンド + フロントエンド同時)
npm run dev
```

起動後、http://localhost:3000 をブラウザで開きます。

### Dockerで Redis / PostgreSQL を起動する場合

```bash
# Redis
docker run -d -p 6379:6379 redis:alpine

# PostgreSQL
docker run -d -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=artist_tracker postgres:16-alpine
```

### 個別起動

```bash
npm run dev:backend    # バックエンドのみ (http://localhost:3001)
npm run dev:frontend   # フロントエンドのみ (http://localhost:3000)
```

---

## 環境変数

### `backend/.env`

| 変数名 | 必須 | 説明 |
|-------|------|------|
| `TICKETMASTER_API_KEY` | はい | Ticketmaster Discovery API キー |
| `DATABASE_URL` | はい | PostgreSQL 接続文字列（例: `postgresql://postgres:postgres@localhost:5432/artist_tracker`） |
| `REDIS_URL` | いいえ | Redis 接続文字列（デフォルト: `redis://localhost:6379`） |
| `PORT` | いいえ | サーバーポート（デフォルト: `3001`） |
| `ALLOWED_ORIGIN` | いいえ | CORS 許可オリジン（デフォルト: `http://localhost:3000`） |

### `frontend/.env.local`

| 変数名 | 必須 | 説明 |
|-------|------|------|
| `NEXT_PUBLIC_BACKEND_URL` | いいえ | バックエンド URL（デフォルト: `http://localhost:3001`） |

---

## 技術的な制約と解決策

| 課題 | 解決策 |
|------|--------|
| `react-globe.gl` の SSR クラッシュ | `next/dynamic` の `ssr: false` による2層パターン（`GlobeView` → `GlobeWrapper`） |
| Ticketmaster の緯度経度が文字列型 | バックエンドで `parseFloat()` + `NaN` チェック + 範囲バリデーション |
| `react-globe.gl` に明示的ピクセルサイズが必要 | `ResizeObserver` でコンテナサイズを計測し props で渡す |
| Express ↔ Next.js 間の CORS | `cors({ origin: 'http://localhost:3000' })` で明示的に許可 |
| MapLibre GL CSS の読み込み | `globals.css` で `@import 'maplibre-gl/dist/maplibre-gl.css'` |
| `forwardRef` + `dynamic import` の型安全性 | `GlobeRef` interface を `types/index.ts` に定義して型のみ import |
| Redis 接続失敗時のサービス停止 | `retryStrategy` で3回リトライ後に停止。`getCache`/`setCache` はエラーをキャッチしてフォールバック |
| Ticketmaster の `"cancelled"`（l×2）スペルミス | `db/events.ts` で `"cancelled"` → `"canceled"` に正規化してから enum にマップ |
