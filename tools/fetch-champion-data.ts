#!/usr/bin/env npx ts-node
/**
 * チャンピオンデータ一括取得ツール
 *
 * 使用方法:
 *   npx ts-node tools/fetch-champion-data.ts [output_path]
 *
 * 例:
 *   npx ts-node tools/fetch-champion-data.ts
 *   npx ts-node tools/fetch-champion-data.ts ./data/champions.json
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const DDRAGON_BASE = 'https://ddragon.leagueoflegends.com';
const LOCALE = 'ja_JP';
const OUTPUT_PATH = process.argv[2] ?? path.join(__dirname, '../data/champions.json');

function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  console.log('🔍 最新バージョンを取得中...');
  const versionsJson = await httpsGet(`${DDRAGON_BASE}/api/versions.json`);
  const versions: string[] = JSON.parse(versionsJson);
  const latestVersion = versions[0];
  console.log(`✅ 最新バージョン: ${latestVersion}`);

  console.log(`\n📦 チャンピオンリストを取得中 (${LOCALE})...`);
  const listJson = await httpsGet(
    `${DDRAGON_BASE}/cdn/${latestVersion}/data/${LOCALE}/champion.json`
  );
  const listData = JSON.parse(listJson);
  const championIds: string[] = Object.keys(listData.data);
  console.log(`✅ チャンピオン数: ${championIds.length}`);

  console.log('\n🚀 全チャンピオンの詳細データを取得中...');
  const details: Record<string, unknown> = {};
  let completed = 0;

  for (const id of championIds) {
    const detailJson = await httpsGet(
      `${DDRAGON_BASE}/cdn/${latestVersion}/data/${LOCALE}/champion/${id}.json`
    );
    details[id] = JSON.parse(detailJson).data[id];
    completed++;
    if (completed % 10 === 0 || completed === championIds.length) {
      process.stdout.write(`\r  進捗: ${completed}/${championIds.length}`);
    }
    // Rate limiting: small delay
    await new Promise((r) => setTimeout(r, 50));
  }
  console.log('\n');

  const output = {
    version: latestVersion,
    locale: LOCALE,
    fetchedAt: new Date().toISOString(),
    championCount: championIds.length,
    data: details,
  };

  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`✅ 保存完了: ${OUTPUT_PATH}`);
  console.log(`   バージョン: ${latestVersion}`);
  console.log(`   チャンピオン数: ${championIds.length}`);
}

main().catch((e) => {
  console.error('❌ エラー:', e.message);
  process.exit(1);
});
