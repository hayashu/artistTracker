# Artist Tracker 技術概要

## アプリ概要

Artist Tracker は、音楽アーティストのライブイベントを検索し、イベント会場を 3D グローブまたは 2D マップ上に可視化する Web アプリケーションです。

ユーザーがアーティスト名を検索すると、バックエンドが Ticketmaster Discovery API v2 からアーティスト情報とイベント情報を取得し、会場の緯度経度をもとに地図上へピンとして表示します。

## 技術スタック

| 領域 | 技術 |
| --- | --- |
| フロントエンド | Next.js, React, TypeScript |
| バックエンド | Express, TypeScript |
| 外部 API | Ticketmaster Discovery API v2 |
| データベース | PostgreSQL |
| ORM | Prisma |
| キャッシュ | Redis, ioredis |
| 2D マップ | react-map-gl, MapLibre GL |
| 3D グローブ | react-globe.gl |
| セッション管理 | express-session, connect-redis |

## 全体構成

```text
User
  ↓
Next.js Frontend
  ↓
Express Backend
  ↓
Ticketmaster Discovery API

Express Backend
  ├─ PostgreSQL: Artist / Event / Venue を永続化
  └─ Redis: API レスポンスとセッションをキャッシュ
```

フロントエンドは Ticketmaster API を直接呼びません。必ず Express バックエンドを経由します。

この構成にすることで、API キーをフロントエンドに公開せずに済み、外部 API レスポンスの正規化、エラーハンドリング、キャッシュ処理をバックエンド側で一元管理できます。

## データベース構成

データベースは主に `Artist`, `Event`, `Venue` の 3 テーブルで構成されています。

```text
Artist 1 ─── N Event N ─── 0..1 Venue
```

## Artist

アーティスト情報を保存します。

| カラム | 内容 |
| --- | --- |
| `id` | Ticketmaster のアーティスト ID |
| `name` | アーティスト名 |
| `url` | Ticketmaster のアーティストページ |
| `imageUrl` | アーティスト画像 |
| `genre` | ジャンル |
| `subGenre` | サブジャンル |
| `createdAt` | 作成日時 |
| `updatedAt` | 更新日時 |

## Venue

イベント会場情報を保存します。

| カラム | 内容 |
| --- | --- |
| `id` | Ticketmaster の会場 ID |
| `name` | 会場名 |
| `city` | 都市 |
| `state` | 州・地域 |
| `country` | 国 |
| `address` | 住所 |
| `lat` | 緯度 |
| `lng` | 経度 |
| `createdAt` | 作成日時 |
| `updatedAt` | 更新日時 |

## Event

ライブイベント情報を保存します。

| カラム | 内容 |
| --- | --- |
| `id` | Ticketmaster のイベント ID |
| `artistId` | 紐づくアーティスト ID |
| `venueId` | 紐づく会場 ID |
| `name` | イベント名 |
| `url` | チケットページ |
| `imageUrl` | イベント画像 |
| `date` | 現地日付 |
| `time` | 現地時刻 |
| `dateTime` | タイムゾーン変換可能な日時 |
| `dateTBD` | 日付未定フラグ |
| `timeTBA` | 時刻未定フラグ |
| `status` | 販売・延期・中止などの状態 |
| `priceCurrency` | 通貨 |
| `priceMin` | 最低価格 |
| `priceMax` | 最高価格 |
| `createdAt` | 作成日時 |
| `updatedAt` | 更新日時 |

イベントステータスは enum で管理しています。

```text
onsale
offsale
canceled
postponed
rescheduled
unknown
```

Ticketmaster API のレスポンスはネストが深く、緯度経度も文字列で返されるため、バックエンド側で正規化してからフロントエンドへ返します。

## 工夫した点

## 1. 検索予測とスペル補正

検索予測では、PostgreSQL に保存済みのアーティスト名を利用しています。

ユーザーが検索フォームに入力すると、フロントエンドからバックエンドの `/api/artists/suggestions` にリクエストが送られます。バックエンドは DB 内のアーティスト名を検索し、候補を返します。

単純な前方一致だけでなく、レーベンシュタイン距離を使って文字列の類似度も計算しています。

```text
入力例: bruno
候補例: Bruno Mars
```

検索時には `SpellCorrector` による補正も行います。過去に保存されたアーティスト名と入力文字列を比較し、一定以上似ている場合はより近いアーティスト名に補正して検索します。

これにより、完全一致しない入力でも検索結果にたどり着きやすくしています。

## 2. Redis による API レスポンスキャッシュ

Ticketmaster API の呼び出し回数を減らし、レスポンス速度を上げるために Redis を使っています。

主なキャッシュキーは以下です。

```text
artist:{keyword}
event:{attractionId}
```

アーティスト検索では、同じキーワードで再検索された場合に Redis から結果を返します。イベント検索でも、同じアーティスト ID のイベント情報を再取得する場合は Redis キャッシュを利用します。

```text
CACHE HIT  → Redis から返す
CACHE MISS → Ticketmaster API を呼び、結果を Redis に保存
```

TTL を設定しているため、古いデータが永続的に残り続けることも防いでいます。

また、`express-session` の保存先にも Redis を利用できる構成になっています。

## 3. 現地時間とユーザー時間の表示

イベント詳細では、イベント会場の現地時間と、ユーザーのタイムゾーンに変換した時間を両方表示します。

Ticketmaster API からは主に以下の日時情報を受け取ります。

| フィールド | 内容 |
| --- | --- |
| `date` | イベント現地の日付 |
| `time` | イベント現地の時刻 |
| `dateTime` | タイムゾーン変換に使える日時 |

画面上では、まずイベントの現地日時を表示します。

```text
現地: Sat, Jun 21, 2026 at 8:00 PM
```

さらにユーザーのタイムゾーンが分かる場合は、JavaScript の `toLocaleDateString` / `toLocaleTimeString` に `timeZone` を指定して、ユーザー時間に変換します。

```text
あなた: Sun, Jun 22, 2026 at 10:00 AM
```

ユーザーのタイムゾーンは `localStorage` に保存されるため、再訪問時にも同じ設定を利用できます。バックエンドには `/api/timezone` もあり、IP アドレスから初期タイムゾーンを推定する設計です。

## 4. 地図と 3D グローブの切り替え

イベント会場は緯度経度を持つため、2D マップと 3D グローブの両方で表示できます。

2D マップでは `react-map-gl` と MapLibre GL を使い、通常の地図としてイベント会場を確認できます。

3D グローブでは `react-globe.gl` を使い、世界中のイベントを地球儀上で俯瞰できます。

`react-globe.gl` はブラウザ API に依存するため、Next.js の SSR と相性が悪い部分があります。そのため、動的 import とクライアントコンポーネント化によって、ブラウザ上でのみ描画されるようにしています。

## 5. API レスポンスの正規化

Ticketmaster API のレスポンスはそのままではフロントエンドで扱いにくいため、バックエンドで必要な形に整えています。

主な正規化内容は以下です。

- 画像一覧から表示に適した画像を選択
- 緯度経度の文字列を数値に変換
- 緯度経度が不正な場合は地図表示対象から除外
- 会場情報を `Venue` として扱いやすい形に変換
- 価格情報を `min`, `max`, `currency` に整理
- イベントステータスを enum に合わせて変換

これにより、フロントエンド側は複雑な Ticketmaster の生レスポンスを意識せず、画面表示に必要なデータだけを扱えます。

## まとめ

このアプリの技術的なポイントは、外部 API のデータをそのまま表示するのではなく、バックエンドで正規化・キャッシュ・永続化してからフロントエンドに渡している点です。

検索予測、Redis キャッシュ、タイムゾーン変換、地図と 3D グローブ表示を組み合わせることで、アーティストのライブ情報を探しやすく、視覚的にも分かりやすい体験にしています。
