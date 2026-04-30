# LoL Damage Calculator ドキュメント

## 概要

League of Legends のダメージ計算機です。Riot Games API を使用してチャンピオンデータを取得し、スキルのダメージや効果を確認できます。

## 機能

- **ダメージ計算機** (`/`): チャンピオンとレベルを選択してスキル情報を確認
- **チャンピオン一覧** (`/champions`): 全チャンピオンをグリッド表示
- **サモナー検索** (`/summoner`): Riot ID でサモナー情報とランクを検索

## セットアップ

### 必要要件

- Node.js 18 以上
- npm または yarn
- Riot Games API キー（[developer.riotgames.com](https://developer.riotgames.com/) で取得）

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/rssh-jp/lol-calcdamage.git
cd lol-calcdamage

# 依存パッケージをインストール
npm install

# 環境変数を設定
cp .env.local.example .env.local
# .env.local を編集して RIOT_API_KEY を設定
```

### 環境変数

`.env.local` に以下を設定してください:

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `RIOT_API_KEY` | Riot Games API キー | `RGAPI-xxxxxxxx-...` |
| `RIOT_REGION` | 対象リージョン（省略可、デフォルト: jp1） | `jp1` |

### 起動

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番起動
npm start
```

## ディレクトリ構成

```
lol-calcdamage/
├── src/
│   ├── app/                  # Next.js App Router ページ
│   │   ├── api/              # API ルート
│   │   │   ├── champions/    # チャンピオン API
│   │   │   └── summoner/     # サモナー API
│   │   ├── champions/        # チャンピオン一覧ページ
│   │   ├── summoner/         # サモナー検索ページ
│   │   ├── layout.tsx        # ルートレイアウト
│   │   └── page.tsx          # ホームページ（ダメージ計算機）
│   ├── components/           # React コンポーネント
│   ├── lib/                  # ライブラリ・型定義
│   └── styles/               # グローバルスタイル
├── docs/                     # ドキュメント
├── tools/                    # ユーティリティツール
├── .env.local.example        # 環境変数サンプル
├── next.config.js
├── package.json
└── tsconfig.json
```

## 注意事項

- Riot Games の開発用 API キーは 24 時間で失効します
- 本番環境ではプロダクションキーの申請が必要です
- サモナー検索は JP1 リージョンのみ対応しています
