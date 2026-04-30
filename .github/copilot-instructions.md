# Copilot Instructions

## プロジェクト概要

**lol-calcdamage** は League of Legends のダメージ計算ツールです。
チャンピオンのレベル・アイテム構成を入力し、通常攻撃およびスキルダメージを計算します。
また Riot ID によるサモナー検索・ランク情報表示機能も持ちます。

## 技術スタック

| 項目 | 詳細 |
|------|------|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript 6 |
| スタイリング | Tailwind CSS 4 |
| 外部 API | Riot Games API / Data Dragon / Meraki Analytics |

## ディレクトリ構成

```
next.config.ts            # Next.js 設定（TypeScript ESM 形式）
src/
  app/                    # Next.js App Router ページ & API Routes
    page.tsx              # トップページ（ダメージ計算 UI）
    champions/page.tsx    # チャンピオン一覧ページ
    summoner/page.tsx     # サモナー検索ページ
    api/
      champions/route.ts         # GET /api/champions
      champions/[id]/route.ts    # GET /api/champions/[id]
      items/route.ts             # GET /api/items
      summoner/route.ts          # GET /api/summoner
  components/             # React コンポーネント
  lib/
    types.ts              # 型定義（Champion, Item, BonusStats など）
    riot-api.ts           # Riot API / Data Dragon クライアント（サーバーサイド）
    damage.ts             # ダメージ計算ロジック（純粋関数）
  styles/
    globals.css           # Tailwind v4 (@import "tailwindcss" + @theme)
```

## 主要モジュール

### `src/lib/damage.ts`

純粋関数のみで構成されるダメージ計算ユーティリティ。外部依存なし。

- `statAtLevel(base, perLevel, level)` — LoL 成長式でレベル時ステータスを算出
- `calcBonusStats(items)` — 選択アイテム一覧から `BonusStats` を集計
- `calcAADamage(...)` — 通常攻撃ダメージ（クリティカル含む）を計算
- `calcSpellDamage(...)` — スキルダメージを計算
- レシリエンス（Lethality）は `lethality * (0.6 + 0.4 * attackerLevel / 18)` で実効値に変換

### `src/lib/riot-api.ts`

サーバーサイド専用の API クライアント。環境変数 `RIOT_API_KEY` / `RIOT_REGION` を使用。

- `getLatestVersion()` — Data Dragon の最新パッチバージョンを取得
- `getChampionList()` — 全チャンピオン一覧（ja_JP）
- `getChampionDetail(id)` — チャンピオン詳細 + Meraki スペルデータ
- `getItemList()` — アイテム一覧
- `getSummonerByRiotId(gameName, tagLine)` — Riot ID → サモナー情報
- in-memory キャッシュ（TTL: 1時間）実装済み

### `src/lib/types.ts`

プロジェクト全体の型定義ファイル。

- `Champion` / `ChampionDetail` — Data Dragon チャンピオンデータ
- `ChampionStats` — ベースステータス（`hp`, `armor`, `attackdamage` など）
- `BonusStats` — アイテム由来のボーナスステータス
- `Item` / `ItemStats` — Data Dragon アイテムデータ
- `MerakiAbility` — Meraki Analytics のスキルデータ（ダメージ係数など）
- `Summoner` / `LeagueEntry` / `RiotAccount` — Riot API サモナーデータ

## 環境変数

```env
RIOT_API_KEY=RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
RIOT_REGION=jp1   # デフォルト: jp1
```

## API エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/champions` | 全チャンピオン一覧 |
| GET | `/api/champions/[id]` | チャンピオン詳細（スペルデータ含む） |
| GET | `/api/items` | アイテム一覧 |
| GET | `/api/summoner?riotId=名前%23タグ` | サモナー + ランク情報 |

## コーディング規約

- **ダメージ計算ロジック**は `src/lib/damage.ts` に純粋関数として追加する
- **API 呼び出し**はすべて `src/lib/riot-api.ts` に集約する（コンポーネントから直接 fetch しない）
- コンポーネントは `src/components/` に配置し、ページ固有でない限り再利用可能にする
- Tailwind CSS のユーティリティクラスを使用し、カスタム CSS は最小限にする
- 型は `src/lib/types.ts` で一元管理する

## バージョン固有の注意事項

### Next.js 15+ の動的ルートパラメータ

Route Handler の `params` は `Promise` になっている。必ず `await` すること。

```ts
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}
```

### Tailwind CSS v4

- `tailwind.config.ts` は不要（削除済み）
- `@tailwind base/components/utilities` の代わりに `@import "tailwindcss"` を使用
- カスタムテーマは `globals.css` の `@theme` ブロックで定義
- PostCSS プラグインは `tailwindcss` ではなく `@tailwindcss/postcss` を使用

### Next.js 設定ファイル

- `next.config.ts`（TypeScript ESM）を使用。`next.config.js` は削除済み
- 型は `import type { NextConfig } from 'next'` で付ける
