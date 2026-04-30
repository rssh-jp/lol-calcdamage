'use client';

import { ChampionDetail, Item } from '@/lib/types';
import {
  calcBonusStats, calcAADamage, calcSpellDamage,
  SpellDamageResult, SpellDamageComponent, DamageType, resolveTooltip,
} from '@/lib/damage';
import { useState } from 'react';
import Image from 'next/image';

interface Props {
  attackerDetail: ChampionDetail;
  attackerLevel: number;
  attackerItems: Item[];
  defenderDetail: ChampionDetail;
  defenderLevel: number;
  defenderItems: Item[];
  version: string;
}

const SPELL_LABELS = ['Q', 'W', 'E', 'R'];

const DAMAGE_TYPE_LABEL: Record<DamageType, { label: string; color: string; bar: string }> = {
  physical: { label: '物理',       color: 'text-orange-400', bar: 'bg-orange-500' },
  magic:    { label: '魔法',       color: 'text-blue-400',   bar: 'bg-blue-500'   },
  true:     { label: 'トゥルー',   color: 'text-white',      bar: 'bg-gray-300'   },
  mixed:    { label: '混合',       color: 'text-purple-400', bar: 'bg-purple-500' },
};

function DamageBar({ damage, maxDamage, type }: { damage: number; maxDamage: number; type: DamageType }) {
  const pct = maxDamage > 0 ? Math.min(100, (damage / maxDamage) * 100) : 0;
  return (
    <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
      <div
        className={`h-2 rounded-full ${DAMAGE_TYPE_LABEL[type].bar} transition-all duration-300`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Meraki コンポーネントの内訳を1行で表示 */
function ComponentBreakdown({ c }: { c: SpellDamageComponent }) {
  const dt = DAMAGE_TYPE_LABEL[c.damageType];
  const parts: string[] = [];
  if (c.flat > 0)      parts.push(`基本 ${c.flat}`);
  if (c.adContrib > 0) parts.push(`AD ${c.adContrib}`);
  if (c.apContrib > 0) parts.push(`AP ${c.apContrib}`);
  return (
    <div className="flex items-center justify-between text-xs py-0.5">
      <div className="flex items-center gap-1.5 text-gray-400">
        <span className={`font-medium ${dt.color}`}>{dt.label}</span>
        <span>{c.attribute}</span>
        {parts.length > 0 && (
          <span className="text-gray-500">({parts.join(' + ')})</span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <span className="text-gray-500 text-xs">実効防御{c.effectiveDefense}</span>
        <span className="text-white font-semibold">{c.damage}</span>
      </div>
    </div>
  );
}

function SpellRow({
  spell,
  label,
  version,
  rank,
  onRankChange,
  result,
  maxDamage,
}: {
  spell: ChampionDetail['spells'][0];
  label: string;
  version: string;
  rank: number;
  onRankChange: (r: number) => void;
  result: SpellDamageResult;
  maxDamage: number;
}) {
  const [showDesc, setShowDesc] = useState(false);
  const imgUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${spell.image.full}`;
  const dt = DAMAGE_TYPE_LABEL[result.damageType];
  const tooltip = resolveTooltip(spell, rank);
  const cooldown = spell.cooldown?.[rank - 1];
  const cost = spell.cost?.[rank - 1];
  const hasMeraki = result.components.length > 0;

  return (
    <div className="lol-card">
      {/* ヘッダー行 */}
      <div className="flex items-center gap-3 mb-2">
        <div className="relative flex-shrink-0">
          <Image src={imgUrl} alt={spell.name} width={44} height={44} className="rounded border border-yellow-600/50" />
          <span className="absolute -top-1 -left-1 bg-yellow-600 text-black text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
            {label}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-yellow-400 font-bold text-sm">{spell.name}</h3>
          <div className="flex items-center gap-2 text-xs">
            <span className={dt.color}>{dt.label}ダメージ</span>
            {cooldown != null && cooldown > 0 && (
              <span className="text-gray-400">CD: <span className="text-blue-300">{cooldown}s</span></span>
            )}
            {cost != null && cost > 0 && (
              <span className="text-gray-400">コスト: <span className="text-blue-300">{cost}</span></span>
            )}
          </div>
        </div>
        {/* ランク選択 */}
        <div className="flex items-center gap-1">
          <span className="text-gray-400 text-xs">Lv:</span>
          <div className="flex gap-1">
            {Array.from({ length: spell.maxrank }, (_, i) => i + 1).map((r) => (
              <button
                key={r}
                onClick={() => onRankChange(r)}
                className={`w-6 h-6 text-xs rounded ${rank === r ? 'bg-yellow-600 text-black font-bold' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ダメージ */}
      {hasMeraki ? (
        <div className="mb-2">
          {result.components.map((c, i) => (
            <ComponentBreakdown key={i} c={c} />
          ))}
          <div className="flex items-center justify-end gap-1 mt-1 border-t border-gray-700 pt-1">
            <span className="text-gray-400 text-xs">合計:</span>
            <span className="text-2xl font-bold text-white">{result.damage}</span>
            <span className="text-gray-400 text-xs">dmg</span>
          </div>
        </div>
      ) : (
        <div className="flex items-end justify-between mb-2">
          {result.fallback && (
            <div className="text-xs text-gray-400 space-y-0.5">
              {result.fallback.baseDamage > 0 && <div>基本: <span className="text-gray-200">{result.fallback.baseDamage}</span></div>}
              {result.fallback.apScaling > 0  && <div>APスケール: <span className="text-blue-300">+{result.fallback.apScaling}</span></div>}
              {result.fallback.adScaling > 0  && <div>ADスケール: <span className="text-orange-300">+{result.fallback.adScaling}</span></div>}
              {result.fallback.effectiveDefense > 0 && <div>実効防御: <span className="text-red-300">{result.fallback.effectiveDefense}</span></div>}
            </div>
          )}
          <div className="text-right ml-auto">
            <span className="text-2xl font-bold text-white">{result.damage}</span>
            <span className="text-gray-400 text-xs ml-1">dmg</span>
          </div>
        </div>
      )}

      <DamageBar damage={result.damage} maxDamage={maxDamage} type={result.damageType} />

      {/* 説明文トグル */}
      <button
        onClick={() => setShowDesc((v) => !v)}
        className="mt-2 text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
      >
        <span>{showDesc ? '▲' : '▼'}</span>
        <span>スキル説明</span>
      </button>
      {showDesc && (
        <div className="mt-2 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap border-t border-gray-700 pt-2">
          {tooltip || '説明文なし'}
        </div>
      )}
    </div>
  );
}

export default function DamageCalculator({
  attackerDetail, attackerLevel, attackerItems,
  defenderDetail, defenderLevel, defenderItems,
  version,
}: Props) {
  const [spellRanks, setSpellRanks] = useState<number[]>(() => attackerDetail.spells.map(() => 1));

  const attackerBonus = calcBonusStats(attackerItems);
  const defenderBonus = calcBonusStats(defenderItems);

  const aaResult = calcAADamage(
    attackerDetail.stats, attackerLevel, attackerBonus,
    defenderDetail.stats, defenderLevel, defenderBonus,
  );

  const spellResults = attackerDetail.spells.map((spell, i) =>
    calcSpellDamage(
      spell, SPELL_LABELS[i] ?? String(i + 1), spellRanks[i] ?? 1,
      attackerDetail.stats, attackerLevel, attackerBonus,
      defenderDetail.stats, defenderLevel, defenderBonus,
    )
  );

  function setRank(index: number, rank: number) {
    setSpellRanks((prev) => prev.map((r, i) => (i === index ? rank : r)));
  }

  const allDamages = [aaResult.damage, aaResult.critDamage, ...spellResults.map((r) => r.damage)];
  const maxDamage = Math.max(...allDamages, 1);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-yellow-400 text-lg font-bold border-b border-yellow-900/50 pb-2">
        ダメージ計算結果
        <span className="text-gray-400 font-normal text-sm ml-2">
          {attackerDetail.name} → {defenderDetail.name}
        </span>
      </h2>

      {/* AA ダメージ */}
      <div className="lol-card">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-yellow-400 font-bold">オートアタック (AA)</h3>
            <span className="text-xs text-orange-400">物理ダメージ</span>
          </div>
          <div className="text-right">
            <div>
              <span className="text-2xl font-bold text-white">{aaResult.damage}</span>
              <span className="text-gray-400 text-xs ml-1">dmg</span>
            </div>
            <div className="text-sm text-yellow-300">
              クリティカル: <span className="font-bold">{aaResult.critDamage}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-4 text-xs text-gray-400 mb-2">
          <span>AD合計: <span className="text-white">{aaResult.totalAD}</span></span>
          <span>実効アーマー: <span className="text-red-300">{aaResult.effectiveArmor}</span></span>
        </div>
        <DamageBar damage={aaResult.damage} maxDamage={maxDamage} type="physical" />
      </div>

      {/* スキル */}
      <h3 className="text-yellow-400 font-semibold">スキルダメージ</h3>
      {attackerDetail.spells.map((spell, i) => (
        <SpellRow
          key={spell.id}
          spell={spell}
          label={SPELL_LABELS[i] ?? String(i + 1)}
          version={version}
          rank={spellRanks[i] ?? 1}
          onRankChange={(r) => setRank(i, r)}
          result={spellResults[i]}
          maxDamage={maxDamage}
        />
      ))}
    </div>
  );
}

