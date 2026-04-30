import ChampionDamageCalc from '@/components/ChampionDamageCalc';
import { getChampionList, getItemList, getLatestVersion } from '@/lib/riot-api';
import { Champion, Item } from '@/lib/types';

export default async function HomePage() {
  let champions: Champion[] = [];
  let items: Item[] = [];
  let version = '';
  let error = '';

  try {
    const [list, itemList, ver] = await Promise.all([getChampionList(), getItemList(), getLatestVersion()]);
    champions = Object.values(list).sort((a, b) => a.name.localeCompare(b.name, 'ja'));
    items = itemList;
    version = ver;
  } catch (e) {
    error = 'チャンピオン/アイテムデータの取得に失敗しました。APIキーを確認してください。';
    console.error(e);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-400 mb-2">ダメージ計算機</h1>
      <p className="text-gray-400 mb-6">チャンピオンと装備を選択してAA・スキルのダメージを確認できます</p>

      {error ? (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error}
        </div>
      ) : (
        <ChampionDamageCalc champions={champions} version={version} items={items} />
      )}
    </div>
  );
}
