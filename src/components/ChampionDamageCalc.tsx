'use client';

import { Champion, ChampionDetail, Item } from '@/lib/types';
import { useState, useEffect } from 'react';
import ChampionSelector from './ChampionSelector';
import LevelSelector from './LevelSelector';
import ChampionCard from './ChampionCard';
import DamageCalculator from './DamageCalculator';
import ItemSelector from './ItemSelector';

interface Props {
  champions: Champion[];
  version: string;
  items: Item[];
}

function useChampionSide(initialId = '') {
  const [selectedId, setSelectedId] = useState(initialId);
  const [level, setLevel] = useState(1);
  const [detail, setDetail] = useState<ChampionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);

  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    setLoading(true);
    setError('');
    fetch(`/api/champions/${selectedId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setDetail(d.champion);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedId]);

  return { selectedId, setSelectedId, level, setLevel, detail, loading, error, selectedItems, setSelectedItems };
}

interface SidePanelProps {
  title: string;
  side: ReturnType<typeof useChampionSide>;
  champions: Champion[];
  version: string;
  items: Item[];
  color: 'blue' | 'red';
}

function SidePanel({ title, side, champions, version, items, color }: SidePanelProps) {
  const border = color === 'blue' ? 'border-blue-500/40' : 'border-red-500/40';
  const heading = color === 'blue' ? 'text-blue-300' : 'text-red-300';
  return (
    <div className={`flex flex-col gap-4 border ${border} rounded-lg p-4 bg-gray-900/40`}>
      <h2 className={`font-bold text-lg ${heading}`}>{title}</h2>
      <div className="lol-card">
        <p className="text-gray-400 text-sm mb-2">チャンピオン選択</p>
        <ChampionSelector
          champions={champions}
          selectedId={side.selectedId}
          onSelect={side.setSelectedId}
        />
      </div>
      <div className="lol-card">
        <p className="text-gray-400 text-sm mb-2">レベル</p>
        <LevelSelector level={side.level} onChange={side.setLevel} />
      </div>
      <div className="lol-card">
        <p className="text-gray-400 text-sm mb-2">アイテム (最大6個)</p>
        <ItemSelector
          items={items}
          version={version}
          selected={side.selectedItems}
          onChange={side.setSelectedItems}
        />
      </div>
      {side.loading && (
        <div className="text-yellow-400 animate-pulse text-sm">読み込み中...</div>
      )}
      {side.error && (
        <div className="text-red-400 text-sm">{side.error}</div>
      )}
      {side.detail && !side.loading && (
        <ChampionCard champion={side.detail} version={version} level={side.level} bonusItems={side.selectedItems} />
      )}
    </div>
  );
}

export default function ChampionDamageCalc({ champions, version, items }: Props) {
  const attacker = useChampionSide();
  const defender = useChampionSide();

  const bothReady = attacker.detail !== null && defender.detail !== null;

  return (
    <div className="flex flex-col gap-6">
      {/* 2体選択パネル */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SidePanel
          title="自分のチャンピオン (攻撃側)"
          side={attacker}
          champions={champions}
          version={version}
          items={items}
          color="blue"
        />
        <SidePanel
          title="相手のチャンピオン (防御側)"
          side={defender}
          champions={champions}
          version={version}
          items={items}
          color="red"
        />
      </div>

      {/* ダメージ結果 */}
      {!bothReady && (
        <div className="lol-card flex items-center justify-center h-24 text-gray-500">
          両方のチャンピオンを選択するとダメージ計算が表示されます
        </div>
      )}
      {bothReady && (
        <DamageCalculator
          attackerDetail={attacker.detail!}
          attackerLevel={attacker.level}
          attackerItems={attacker.selectedItems}
          defenderDetail={defender.detail!}
          defenderLevel={defender.level}
          defenderItems={defender.selectedItems}
          version={version}
        />
      )}
    </div>
  );
}

