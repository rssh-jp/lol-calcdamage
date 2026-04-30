# API ドキュメント

## 内部 API エンドポイント

### GET /api/champions

全チャンピオンリストを取得します。

**レスポンス**

```json
{
  "champions": [
    {
      "id": "Aatrox",
      "key": "266",
      "name": "エイトロックス",
      "title": "ダーキン・ブレード",
      "tags": ["Fighter", "Tank"],
      "stats": { "hp": 650, "attackdamage": 60, ... }
    }
  ],
  "version": "14.10.1"
}
```

---

### GET /api/champions/[id]

特定チャンピオンの詳細データ（スペル情報を含む）を取得します。

**パスパラメータ**

| パラメータ | 説明 | 例 |
|------------|------|-----|
| `id` | チャンピオン ID | `Aatrox`, `Jinx`, `Lux` |

**レスポンス**

```json
{
  "champion": {
    "id": "Aatrox",
    "name": "エイトロックス",
    "spells": [
      {
        "id": "AatroxQ",
        "name": "ダークフライト",
        "description": "...",
        "tooltip": "...",
        "maxrank": 5,
        "cooldown": [14, 12, 10, 8, 6],
        "cost": [0, 0, 0, 0, 0],
        "range": [25000, 25000, 25000, 25000, 25000]
      }
    ]
  },
  "version": "14.10.1"
}
```

---

### GET /api/summoner

サモナー情報を Riot ID または サモナー名で検索します。

**クエリパラメータ**

| パラメータ | 説明 | 例 |
|------------|------|-----|
| `riotId` | Riot ID（`ゲーム名#タグ`形式） | `Player%23JP1` |
| `name` | サモナー名（レガシー） | `Player` |

**レスポンス**

```json
{
  "summoner": {
    "id": "...",
    "puuid": "...",
    "name": "Player",
    "profileIconId": 4864,
    "summonerLevel": 200
  },
  "leagueEntries": [
    {
      "queueType": "RANKED_SOLO_5x5",
      "tier": "GOLD",
      "rank": "II",
      "leaguePoints": 75,
      "wins": 120,
      "losses": 95
    }
  ],
  "version": "14.10.1"
}
```

## 外部 API

### Riot Data Dragon

チャンピオンの静的データは [Riot Data Dragon](https://developer.riotgames.com/docs/lol#data-dragon) から取得します（API キー不要）。

- バージョン一覧: `https://ddragon.leagueoflegends.com/api/versions.json`
- チャンピオン一覧: `https://ddragon.leagueoflegends.com/cdn/{version}/data/ja_JP/champion.json`
- チャンピオン詳細: `https://ddragon.leagueoflegends.com/cdn/{version}/data/ja_JP/champion/{id}.json`

### Riot Games API

リアルタイムのサモナーデータは Riot API から取得します（API キー必要）。

- アカウント検索: `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}`
- PUUID でサモナー取得: `https://jp1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/{puuid}`
- ランク情報: `https://jp1.api.riotgames.com/lol/league/v4/entries/by-summoner/{summonerId}`
