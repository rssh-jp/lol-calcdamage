import { LeagueEntry, Summoner } from '@/lib/types';
import Image from 'next/image';

interface Props {
  summoner: Summoner;
  leagueEntries: LeagueEntry[];
  version: string;
}

const QUEUE_LABELS: Record<string, string> = {
  RANKED_SOLO_5x5: 'ランクソロ/デュオ',
  RANKED_FLEX_SR: 'ランクフレックス',
  RANKED_FLEX_TT: 'ランクフレックス (3v3)',
};

const TIER_COLORS: Record<string, string> = {
  IRON: 'text-gray-400',
  BRONZE: 'text-orange-700',
  SILVER: 'text-gray-300',
  GOLD: 'text-yellow-500',
  PLATINUM: 'text-cyan-400',
  EMERALD: 'text-green-400',
  DIAMOND: 'text-blue-300',
  MASTER: 'text-purple-400',
  GRANDMASTER: 'text-red-400',
  CHALLENGER: 'text-yellow-300',
};

export default function SummonerCard({ summoner, leagueEntries, version }: Props) {
  const iconUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${summoner.profileIconId}.png`;

  return (
    <div className="lol-card">
      <div className="flex items-center gap-4 mb-4">
        <Image
          src={iconUrl}
          alt="Profile Icon"
          width={80}
          height={80}
          className="rounded-full border-2 border-yellow-600"
        />
        <div>
          <h2 className="text-yellow-400 text-2xl font-bold">{summoner.name}</h2>
          <p className="text-gray-400">サモナーレベル: <span className="text-white">{summoner.summonerLevel}</span></p>
        </div>
      </div>

      {leagueEntries.length === 0 ? (
        <p className="text-gray-500 italic">ランクデータなし（アンランク）</p>
      ) : (
        <div className="flex flex-col gap-3">
          {leagueEntries.map((entry) => {
            const winRate = Math.round((entry.wins / (entry.wins + entry.losses)) * 100);
            const tierColor = TIER_COLORS[entry.tier] ?? 'text-white';
            return (
              <div key={entry.queueType} className="bg-gray-800 rounded p-3">
                <p className="text-gray-400 text-sm mb-1">
                  {QUEUE_LABELS[entry.queueType] ?? entry.queueType}
                </p>
                <div className="flex items-center justify-between">
                  <span className={`text-lg font-bold ${tierColor}`}>
                    {entry.tier} {entry.rank}
                  </span>
                  <span className="text-yellow-400">{entry.leaguePoints} LP</span>
                </div>
                <div className="flex gap-4 text-sm mt-1">
                  <span className="text-green-400">{entry.wins}勝</span>
                  <span className="text-red-400">{entry.losses}敗</span>
                  <span className="text-gray-400">勝率 {winRate}%</span>
                  {entry.hotStreak && <span className="text-orange-400">🔥 連勝中</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
