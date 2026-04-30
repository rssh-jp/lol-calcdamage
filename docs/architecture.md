# アーキテクチャ

## 技術スタック

| 項目 | 技術 |
|------|------|
| フレームワーク | Next.js 14 (App Router) |
| UI ライブラリ | React 18 |
| 言語 | TypeScript 5 |
| スタイリング | Tailwind CSS 3 |
| データソース | Riot Games API + Data Dragon |

## アーキテクチャ概要

```
                    ┌─────────────────────────────────────┐
                    │          Next.js Application         │
                    │                                       │
  ブラウザ  ─────► │  ┌─────────────┐  ┌──────────────┐  │
                    │  │   Pages     │  │  API Routes  │  │
                    │  │  (Server)   │  │  (Server)    │  │
                    │  └──────┬──────┘  └──────┬───────┘  │
                    │         │                 │          │
                    │  ┌──────▼─────────────────▼───────┐  │
                    │  │        Riot API Client          │  │
                    │  │       (src/lib/riot-api.ts)     │  │
                    │  └──────────────────┬──────────────┘  │
                    └────────────────────────────────────── ┘
                                          │
                        ┌─────────────────┼─────────────────┐
                        ▼                 ▼                  ▼
               Data Dragon API     jp1 Riot API      asia Riot API
              (Static Data)      (Summoner/League) (Account/PUUID)
```

## データフロー

### チャンピオンデータ取得

1. Next.js サーバーコンポーネントが `getChampionList()` を呼び出す
2. `riot-api.ts` が Data Dragon から最新バージョンを取得
3. 日本語（ja_JP）のチャンピオンデータを取得
4. クライアントに HTML としてレンダリング（ISR: 1時間キャッシュ）

### サモナー検索フロー

1. ユーザーが Riot ID（`名前#タグ`）を入力してフォーム送信
2. クライアントが `/api/summoner?riotId=名前#タグ` を fetch
3. API ルートが `asia.api.riotgames.com` でアカウントを検索 → PUUID 取得
4. `jp1.api.riotgames.com` でサモナー情報 + ランク情報を並列取得
5. JSON レスポンスをクライアントに返す
6. `SummonerCard` コンポーネントで表示

## キャッシング戦略

| データ | キャッシュ時間 | 理由 |
|--------|-------------|------|
| バージョン情報 | 1時間 | パッチは2週間ごと |
| チャンピオン一覧 | 1時間 | パッチ後のみ更新 |
| チャンピオン詳細 | 1時間 | パッチ後のみ更新 |
| サモナー情報 | 5分 | LP/ランクは変動 |

## コンポーネント設計

### サーバーコンポーネント (デフォルト)
- `app/page.tsx` — チャンピオンリストを事前取得
- `app/champions/page.tsx` — 全チャンピオン一覧を事前取得
- `app/summoner/page.tsx` — 静的シェルのみ

### クライアントコンポーネント ('use client')
- `ChampionDamageCalc` — チャンピオン選択・詳細取得の状態管理
- `ChampionSelector` — インタラクティブなドロップダウン
- `LevelSelector` — レベルスライダー
- `DamageCalculator` — ランク選択 + ツールチップ表示
- `SummonerSearch` — 検索フォームと結果表示
