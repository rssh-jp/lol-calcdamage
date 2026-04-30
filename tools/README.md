# Tools

このディレクトリにはユーティリティスクリプトが含まれています。

## fetch-champion-data.ts

全チャンピオンの詳細データを Riot Data Dragon から一括取得して JSON ファイルに保存します。

### 使用方法

```bash
# デフォルトパス (data/champions.json) に保存
npx ts-node tools/fetch-champion-data.ts

# カスタムパスに保存
npx ts-node tools/fetch-champion-data.ts ./my-output/champs.json
```

### 出力形式

```json
{
  "version": "14.10.1",
  "locale": "ja_JP",
  "fetchedAt": "2024-05-01T00:00:00.000Z",
  "championCount": 168,
  "data": {
    "Aatrox": { ... },
    "Ahri": { ... }
  }
}
```

### 注意事項

- API キー不要（Data Dragon は公開 API）
- 全チャンピオンの取得に数分かかる場合があります
- レート制限のため 50ms のウェイトが入ります
