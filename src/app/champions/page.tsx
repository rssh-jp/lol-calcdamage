import { getChampionList, getLatestVersion } from '@/lib/riot-api';
import { Champion } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';

export default async function ChampionsPage() {
  let champions: Champion[] = [];
  let version = '';
  let error = '';

  try {
    const [list, ver] = await Promise.all([getChampionList(), getLatestVersion()]);
    champions = Object.values(list).sort((a, b) => a.name.localeCompare(b.name, 'ja'));
    version = ver;
  } catch (e) {
    error = 'チャンピオンデータの取得に失敗しました。';
    console.error(e);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-400 mb-2">チャンピオン一覧</h1>
      <p className="text-gray-400 mb-6">全 {champions.length} チャンピオン</p>

      {error ? (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {champions.map((champ) => {
            const imageUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champ.image.full}`;
            return (
              <Link
                key={champ.id}
                href={`/?champion=${champ.id}`}
                className="lol-card flex flex-col items-center gap-2 hover:border-yellow-400/60 transition-colors cursor-pointer"
              >
                <Image
                  src={imageUrl}
                  alt={champ.name}
                  width={64}
                  height={64}
                  className="rounded"
                />
                <div className="text-center">
                  <p className="text-yellow-400 text-sm font-medium">{champ.name}</p>
                  <p className="text-gray-500 text-xs">{champ.tags.join(' / ')}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
