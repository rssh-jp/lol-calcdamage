import { Champion, Item } from '@/lib/types';
import { calcBonusStats, statAtLevel } from '@/lib/damage';
import Image from 'next/image';

interface Props {
  champion: Champion;
  version: string;
  level: number;
  bonusItems?: Item[];
}

export default function ChampionCard({ champion, version, level, bonusItems = [] }: Props) {
  const imageUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.image.full}`;
  const s = champion.stats;
  const bonus = calcBonusStats(bonusItems);

  const stats = [
    { label: 'HP',        value: (statAtLevel(s.hp, s.hpperlevel, level) + bonus.hp).toFixed(0) },
    { label: '攻撃力',   value: (statAtLevel(s.attackdamage, s.attackdamageperlevel, level) + bonus.bonusAD).toFixed(1) },
    { label: 'AP',        value: bonus.ap.toFixed(0) },
    { label: 'アーマー', value: (statAtLevel(s.armor, s.armorperlevel, level) + bonus.armor).toFixed(1) },
    { label: 'MR',        value: (statAtLevel(s.spellblock, s.spellblockperlevel, level) + bonus.mr).toFixed(1) },
    { label: '移動速度', value: s.movespeed },
    { label: '攻撃射程', value: s.attackrange },
    { label: '攻撃速度', value: statAtLevel(s.attackspeed, s.attackspeedperlevel / 100, level).toFixed(3) },
  ];

  return (
    <div className="lol-card flex gap-4">
      <div className="flex-shrink-0">
        <Image
          src={imageUrl}
          alt={champion.name}
          width={96}
          height={96}
          className="rounded border border-yellow-600/50"
        />
        <div className="flex flex-wrap gap-1 mt-2 max-w-[96px]">
          {champion.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-yellow-900/50 text-yellow-300 px-1 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="flex-1">
        <h2 className="text-yellow-400 text-xl font-bold">{champion.name}</h2>
        <p className="text-gray-400 text-sm italic mb-3">{champion.title}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {stats.map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-400">{label}</span>
              <span className="text-white font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
