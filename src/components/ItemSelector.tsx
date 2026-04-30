'use client';

import { Item, BonusStats } from '@/lib/types';
import { calcBonusStats } from '@/lib/damage';
import { useState, useMemo } from 'react';
import Image from 'next/image';

const MAX_ITEMS = 6;

// ゲームモード定義
const GAME_MODES: { label: string; mapId: string }[] = [
  { label: 'SR',    mapId: '11' },  // Summoner's Rift
  { label: 'ARAM',  mapId: '12' },  // Howling Abyss
  { label: 'Arena', mapId: '30' },  // 2v2v2v2
  { label: 'NBlitz',mapId: '21' },  // Nexus Blitz
];

// カテゴリ定義: label → マッチする tags (いずれか含めば該当)
const CATEGORIES: { label: string; tags: string[] }[] = [
  { label: 'すべて',       tags: [] },
  { label: 'AD',          tags: ['Damage'] },
  { label: 'クリティカル', tags: ['CriticalStrike'] },
  { label: 'AP',          tags: ['SpellDamage'] },
  { label: 'AS/オンヒット',tags: ['AttackSpeed', 'OnHit'] },
  { label: 'アーマー',     tags: ['Armor'] },
  { label: 'MR',          tags: ['SpellBlock'] },
  { label: 'HP',          tags: ['Health'] },
  { label: 'ブーツ',       tags: ['Boots'] },
  { label: 'ジャングル',   tags: ['Jungle'] },
  { label: 'サポート',     tags: ['Lane', 'GoldPer', 'Aura'] },
  { label: '消耗品',       tags: ['Consumable'] },
];

interface Props {
  items: Item[];
  version: string;
  selected: Item[];
  onChange: (items: Item[]) => void;
}

function ItemIcon({ item, version, size = 48 }: { item: Item; version: string; size?: number }) {
  const url = `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${item.image.full}`;
  return (
    <Image
      src={url}
      alt={item.name}
      width={size}
      height={size}
      className="rounded border border-yellow-700/50 object-cover"
    />
  );
}

function statLabel(bonus: BonusStats): string {
  const parts: string[] = [];
  if (bonus.bonusAD)       parts.push(`AD+${Math.round(bonus.bonusAD)}`);
  if (bonus.ap)            parts.push(`AP+${Math.round(bonus.ap)}`);
  if (bonus.armor)         parts.push(`アーマー+${Math.round(bonus.armor)}`);
  if (bonus.mr)            parts.push(`MR+${Math.round(bonus.mr)}`);
  if (bonus.hp)            parts.push(`HP+${Math.round(bonus.hp)}`);
  if (bonus.lethality)     parts.push(`貫通+${Math.round(bonus.lethality)}`);
  if (bonus.armorPenPct)   parts.push(`貫通+${Math.round(bonus.armorPenPct * 100)}%`);
  if (bonus.magicPenFlat)  parts.push(`魔法貫通+${Math.round(bonus.magicPenFlat)}`);
  if (bonus.magicPenPct)   parts.push(`魔法貫通+${Math.round(bonus.magicPenPct * 100)}%`);
  if (bonus.critChance)    parts.push(`クリ+${Math.round(bonus.critChance * 100)}%`);
  return parts.join(' / ') || 'ステータスなし';
}

export default function ItemSelector({ items, version, selected, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const [activeMode, setActiveMode] = useState(0); // デフォルト: SR

  const filtered = useMemo(() => {
    const mapId = GAME_MODES[activeMode].mapId;
    // マップフィルタ (maps[mapId] === true のみ)
    let base = items.filter((i) => i.maps[mapId] === true);
    // 検索クエリ優先
    if (query.trim()) {
      const q = query.toLowerCase();
      return base.filter((i) => i.name.toLowerCase().includes(q));
    }
    // カテゴリフィルタ
    const cat = CATEGORIES[activeCategory];
    if (cat.tags.length > 0) {
      base = base.filter((i) => cat.tags.some((t) => i.tags.includes(t)));
    }
    return base;
  }, [items, query, activeCategory, activeMode]);

  const totalBonus = useMemo(() => calcBonusStats(selected), [selected]);

  function addItem(item: Item) {
    if (selected.length >= MAX_ITEMS) return;
    onChange([...selected, item]);
  }

  function removeItem(index: number) {
    onChange(selected.filter((_, i) => i !== index));
  }

  return (
    <div>
      {/* 選択済みアイテム */}
      <div className="flex flex-wrap gap-2 mb-2 min-h-[40px]">
        {selected.map((item, i) => (
          <div key={`${item.id}-${i}`} className="relative group" title={item.name}>
            <ItemIcon item={item} version={version} size={36} />
            <button
              onClick={() => removeItem(i)}
              className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-4 h-4 rounded-full hidden group-hover:flex items-center justify-center leading-none"
              aria-label={`${item.name}を削除`}
            >
              ×
            </button>
          </div>
        ))}
        {selected.length < MAX_ITEMS && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-9 h-9 rounded border-2 border-dashed border-yellow-700/50 text-yellow-600 text-xl flex items-center justify-center hover:border-yellow-400 hover:text-yellow-400 transition-colors"
            aria-label="アイテム追加"
          >
            +
          </button>
        )}
      </div>

      {/* ボーナスステータス表示 */}
      {selected.length > 0 && (
        <p className="text-xs text-green-400 mb-2">{statLabel(totalBonus)}</p>
      )}

      {/* アイテムピッカー */}
      {open && (
        <div className="mt-1 bg-gray-900 border border-gray-700 rounded-lg p-2">
          {/* ゲームモード選択 */}
          <div className="flex gap-1 mb-2">
            {GAME_MODES.map((mode, idx) => (
              <button
                key={mode.mapId}
                onClick={() => { setActiveMode(idx); setActiveCategory(0); }}
                className={`px-3 py-0.5 rounded text-xs font-bold transition-colors ${
                  activeMode === idx
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* 検索 */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="アイテム名で検索..."
            className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-yellow-500 mb-2"
            autoFocus
          />

          {/* カテゴリタブ */}
          {!query.trim() && (
            <div className="flex flex-wrap gap-1 mb-2">
              {CATEGORIES.map((cat, idx) => (
                <button
                  key={cat.label}
                  onClick={() => setActiveCategory(idx)}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                    activeCategory === idx
                      ? 'bg-yellow-600 text-black'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {/* アイテムグリッド (5列) */}
          <div className="max-h-64 overflow-y-auto">
            <div className="grid grid-cols-5 gap-1">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addItem(item)}
                  title={`${item.name}\n${item.gold.total}G\n${item.plaintext}`}
                  disabled={selected.length >= MAX_ITEMS}
                  className="flex flex-col items-center gap-0.5 p-1 rounded hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ItemIcon item={item} version={version} size={48} />
                  <span className="text-gray-300 text-[10px] leading-tight text-center line-clamp-2 w-full">
                    {item.name}
                  </span>
                  <span className="text-yellow-700 text-[9px]">{item.gold.total}G</span>
                </button>
              ))}
            </div>
            {filtered.length === 0 && (
              <p className="text-gray-500 text-sm px-2 py-4 text-center">該当なし</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
