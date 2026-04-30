import SummonerSearch from '@/components/SummonerSearch';

export default function SummonerPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-400 mb-2">サモナー検索</h1>
      <p className="text-gray-400 mb-6">
        Riot IDで検索: <span className="text-yellow-400">ゲーム名#タグライン</span>（例: Player#JP1）
      </p>
      <SummonerSearch />
    </div>
  );
}
