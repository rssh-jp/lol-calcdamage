/**
 * LoL ダメージ計算ユーティリティ
 *
 * 参考:
 *   - https://leagueoflegends.fandom.com/wiki/Armor_(statistic)
 *   - https://leagueoflegends.fandom.com/wiki/Magic_resistance_(statistic)
 *   - https://leagueoflegends.fandom.com/wiki/Lethality
 */

import { BonusStats, ChampionStats, ChampionSpell, Item, MerakiAbility } from './types';

// ---------- ステータス計算 ----------

/** チャンピオンレベルでのステータス計算 (LoL成長式) */
export function statAtLevel(base: number, perLevel: number, level: number): number {
  const growth = perLevel * (level - 1) * (0.7025 + 0.0175 * (level - 1));
  return base + growth;
}

/** 選択アイテムからボーナスステータスを集計する */
export function calcBonusStats(items: Item[]): BonusStats {
  const bonus: BonusStats = {
    bonusAD: 0, ap: 0, armor: 0, mr: 0, hp: 0,
    lethality: 0, armorPenPct: 0,
    magicPenFlat: 0, magicPenPct: 0,
    critChance: 0, attackSpeedPct: 0,
  };
  for (const item of items) {
    const s = item.stats;
    if (!s) continue;
    bonus.bonusAD    += s.FlatPhysicalDamageMod ?? 0;
    bonus.ap         += s.FlatMagicDamageMod ?? 0;
    bonus.armor      += s.FlatArmorMod ?? 0;
    bonus.mr         += s.FlatSpellBlockMod ?? 0;
    bonus.hp         += s.FlatHPPoolMod ?? 0;
    bonus.lethality  += s.FlatArmorPenetrationMod ?? 0;
    bonus.armorPenPct    += s.PercentArmorPenetrationMod ?? 0;
    bonus.magicPenFlat   += s.FlatMagicPenetrationMod ?? 0;
    bonus.magicPenPct    += s.PercentMagicPenetrationMod ?? 0;
    bonus.critChance     += s.FlatCritChanceMod ?? 0;
    bonus.attackSpeedPct += s.PercentAttackSpeedMod ?? 0;
  }
  return bonus;
}

// ---------- ダメージ軽減計算 ----------

/**
 * レシリエンス(lethality) → 実効フラットアーマー貫通
 * = lethality * (0.6 + 0.4 * attackerLevel / 18)
 */
function lethalityToFlat(lethality: number, attackerLevel: number): number {
  return lethality * (0.6 + 0.4 * attackerLevel / 18);
}

function calcEffectiveArmor(
  targetArmor: number,
  attackerLevel: number,
  bonus: BonusStats,
): number {
  const flat = lethalityToFlat(bonus.lethality, attackerLevel);
  return Math.max(0, targetArmor * (1 - bonus.armorPenPct) - flat);
}

function calcEffectiveMR(targetMR: number, bonus: BonusStats): number {
  return Math.max(0, targetMR * (1 - bonus.magicPenPct) - bonus.magicPenFlat);
}

function armorMitigation(armor: number): number {
  if (armor >= 0) return 100 / (100 + armor);
  return 2 - 100 / (100 - armor);
}

function mrMitigation(mr: number): number {
  if (mr >= 0) return 100 / (100 + mr);
  return 2 - 100 / (100 - mr);
}

// ---------- AA ダメージ ----------

export interface AADamageResult {
  rawDamage: number;
  effectiveArmor: number;
  damage: number;
  critDamage: number;
  totalAD: number;
}

export function calcAADamage(
  attackerStats: ChampionStats,
  attackerLevel: number,
  attackerBonus: BonusStats,
  defenderStats: ChampionStats,
  defenderLevel: number,
  defenderBonus: BonusStats,
): AADamageResult {
  const baseAD = statAtLevel(attackerStats.attackdamage, attackerStats.attackdamageperlevel, attackerLevel);
  const totalAD = baseAD + attackerBonus.bonusAD;

  const baseArmor = statAtLevel(defenderStats.armor, defenderStats.armorperlevel, defenderLevel);
  const totalArmor = baseArmor + defenderBonus.armor;

  const effArmor = calcEffectiveArmor(totalArmor, attackerLevel, attackerBonus);
  const mitigation = armorMitigation(effArmor);

  return {
    rawDamage: Math.round(totalAD),
    effectiveArmor: Math.round(effArmor),
    damage: Math.round(totalAD * mitigation),
    critDamage: Math.round(totalAD * 1.75 * mitigation),
    totalAD: Math.round(totalAD),
  };
}

// ---------- スキルダメージ ----------

export type DamageType = 'physical' | 'magic' | 'true' | 'mixed';

/** スキルダメージの1コンポーネント（属性ごと） */
export interface SpellDamageComponent {
  /** 属性名 (Meraki の leveling.attribute) */
  attribute: string;
  damageType: DamageType;
  /** 軽減前の合計ダメージ */
  raw: number;
  /** 軽減後のダメージ */
  damage: number;
  /** 内訳: フラット */
  flat: number;
  /** 内訳: ADスケーリング寄与 */
  adContrib: number;
  /** 内訳: APスケーリング寄与 */
  apContrib: number;
  /** 実効防御値 */
  effectiveDefense: number;
}

export interface SpellDamageResult {
  spellName: string;
  label: string;
  rank: number;
  /** 全コンポーネントの合計軽減後ダメージ */
  damage: number;
  /** 主なダメージタイプ */
  damageType: DamageType;
  /** 個別コンポーネント (Meraki データあり時) */
  components: SpellDamageComponent[];
  /** Meraki データなし時のフォールバック内訳 */
  fallback?: {
    baseDamage: number;
    apScaling: number;
    adScaling: number;
    effectiveDefense: number;
    rawTotal: number;
  };
}

// ---------- Meraki ベースのスキルダメージ計算 ----------

/**
 * 「サブコンポーネント」はスキップする属性パターン
 * 例: "Damage Per Arrow", "Damage Per Tick" → 合計値が別にある場合はスキップ
 */
const SUB_COMPONENT_PATTERNS = [
  'per arrow', 'per bolt', 'per tick', 'per second', 'per stack',
  'per hit', 'per blade', 'on-hit', 'per target', 'per unit',
  'minimum', 'maximum', 'base damage', // range 表記のとき
];

function isSubComponent(attr: string): boolean {
  const lower = attr.toLowerCase();
  return SUB_COMPONENT_PATTERNS.some((p) => lower.includes(p));
}

function isDamageAttribute(attr: string): boolean {
  return attr.toLowerCase().includes('damage');
}

function attributeToDamageType(attr: string): DamageType {
  const lower = attr.toLowerCase();
  if (lower.includes('physical')) return 'physical';
  if (lower.includes('true')) return 'true';
  return 'magic';
}

export function calcSpellDamageFromMeraki(
  ability: MerakiAbility,
  rank: number,
  attackerStats: ChampionStats,
  attackerLevel: number,
  attackerBonus: BonusStats,
  defenderStats: ChampionStats,
  defenderLevel: number,
  defenderBonus: BonusStats,
): SpellDamageComponent[] {
  const baseAD = statAtLevel(attackerStats.attackdamage, attackerStats.attackdamageperlevel, attackerLevel);
  const totalAD = baseAD + attackerBonus.bonusAD;
  const totalAP = attackerBonus.ap;

  const baseArmor = statAtLevel(defenderStats.armor, defenderStats.armorperlevel, defenderLevel);
  const totalArmor = baseArmor + defenderBonus.armor;
  const baseMR = statAtLevel(defenderStats.spellblock, defenderStats.spellblockperlevel, defenderLevel);
  const totalMR = baseMR + defenderBonus.mr;

  const effArmor = calcEffectiveArmor(totalArmor, attackerLevel, attackerBonus);
  const effMR = calcEffectiveMR(totalMR, attackerBonus);

  // 全 damage attribute を収集
  const damageEntries: { attr: string; flat: number; adPct: number; bonusAdPct: number; apPct: number }[] = [];

  for (const effect of ability.effects) {
    for (const leveling of effect.leveling) {
      if (!isDamageAttribute(leveling.attribute)) continue;

      const idx = rank - 1;
      let flat = 0, adPct = 0, bonusAdPct = 0, apPct = 0;

      for (const mod of leveling.modifiers) {
        const val = mod.values[idx] ?? mod.values[mod.values.length - 1] ?? 0;
        const unit = (mod.units[idx] ?? mod.units[mod.units.length - 1] ?? '').trim();
        if (unit === '') flat += val;
        else if (unit === '% AD') adPct += val;
        else if (unit === '% bonus AD') bonusAdPct += val;
        else if (unit === '% AP') apPct += val;
        // % health 等は現状スキップ
      }

      damageEntries.push({ attr: leveling.attribute, flat, adPct, bonusAdPct, apPct });
    }
  }

  if (damageEntries.length === 0) return [];

  // "Total" を含む属性があればそちらを優先、なければサブコンポーネントを除外
  const hasTotal = damageEntries.some((e) => e.attr.toLowerCase().includes('total'));
  const filtered = hasTotal
    ? damageEntries.filter((e) => e.attr.toLowerCase().includes('total'))
    : damageEntries.filter((e) => !isSubComponent(e.attr));

  const target = filtered.length > 0 ? filtered : damageEntries;

  return target.map((entry) => {
    const dmgType = attributeToDamageType(entry.attr);
    const adContrib = (entry.adPct / 100) * totalAD + (entry.bonusAdPct / 100) * attackerBonus.bonusAD;
    const apContrib = (entry.apPct / 100) * totalAP;
    const raw = entry.flat + adContrib + apContrib;

    let damage: number;
    let effectiveDefense: number;
    if (dmgType === 'physical') {
      effectiveDefense = Math.round(effArmor);
      damage = Math.round(raw * armorMitigation(effArmor));
    } else if (dmgType === 'true') {
      effectiveDefense = 0;
      damage = Math.round(raw);
    } else {
      effectiveDefense = Math.round(effMR);
      damage = Math.round(raw * mrMitigation(effMR));
    }

    return {
      attribute: entry.attr,
      damageType: dmgType,
      raw: Math.round(raw),
      damage,
      flat: Math.round(entry.flat),
      adContrib: Math.round(adContrib),
      apContrib: Math.round(apContrib),
      effectiveDefense,
    };
  });
}

// ---------- フォールバック (Meraki データなし) ----------

function guessDamageType(spell: ChampionSpell): DamageType {
  if (!spell.vars || spell.vars.length === 0) return 'magic';
  const links = spell.vars.map((v) => v.link.toLowerCase());
  const hasAP = links.some((l) => l.includes('spelldamage'));
  const hasAD = links.some((l) => l.includes('attackdamage'));
  if (hasAP && hasAD) return 'mixed';
  if (hasAD) return 'physical';
  return 'magic';
}

function getBaseDamage(spell: ChampionSpell, rank: number): number {
  let max = 0;
  if (!spell.effect) return 0;
  for (let i = 1; i < spell.effect.length; i++) {
    const arr = spell.effect[i];
    if (!arr) continue;
    const val = arr[rank - 1] ?? 0;
    if (val > max) max = val;
  }
  return max;
}

// ---------- メイン calcSpellDamage ----------

export function calcSpellDamage(
  spell: ChampionSpell,
  label: string,
  rank: number,
  attackerStats: ChampionStats,
  attackerLevel: number,
  attackerBonus: BonusStats,
  defenderStats: ChampionStats,
  defenderLevel: number,
  defenderBonus: BonusStats,
): SpellDamageResult {
  // Meraki データがあればそちらを使用
  if (spell.merakiData) {
    const components = calcSpellDamageFromMeraki(
      spell.merakiData, rank,
      attackerStats, attackerLevel, attackerBonus,
      defenderStats, defenderLevel, defenderBonus,
    );

    const totalDamage = components.reduce((sum, c) => sum + c.damage, 0);
    const primaryType: DamageType = components.length > 0 ? components[0].damageType : 'magic';

    return {
      spellName: spell.name,
      label,
      rank,
      damage: totalDamage,
      damageType: primaryType,
      components,
    };
  }

  // --- フォールバック ---
  const baseAD = statAtLevel(attackerStats.attackdamage, attackerStats.attackdamageperlevel, attackerLevel);
  const totalAD = baseAD + attackerBonus.bonusAD;
  const totalAP = attackerBonus.ap;

  const baseDamage = getBaseDamage(spell, rank);
  let apScaling = 0, adScaling = 0;
  if (spell.vars) {
    for (const v of spell.vars) {
      const coeff = Array.isArray(v.coeff) ? (v.coeff[rank - 1] ?? 0) : v.coeff;
      const link = v.link.toLowerCase();
      if (link.includes('spelldamage')) apScaling += coeff * totalAP;
      else if (link === 'attackdamage') adScaling += coeff * totalAD;
      else if (link === 'bonusattackdamage') adScaling += coeff * attackerBonus.bonusAD;
    }
  }
  const rawTotal = baseDamage + apScaling + adScaling;

  const baseArmor = statAtLevel(defenderStats.armor, defenderStats.armorperlevel, defenderLevel);
  const totalArmor = baseArmor + defenderBonus.armor;
  const baseMR = statAtLevel(defenderStats.spellblock, defenderStats.spellblockperlevel, defenderLevel);
  const totalMR = baseMR + defenderBonus.mr;
  const effArmor = calcEffectiveArmor(totalArmor, attackerLevel, attackerBonus);
  const effMR = calcEffectiveMR(totalMR, attackerBonus);
  const damageType = guessDamageType(spell);

  let damage: number, effectiveDefense: number;
  if (damageType === 'physical') {
    effectiveDefense = Math.round(effArmor);
    damage = Math.round(rawTotal * armorMitigation(effArmor));
  } else if (damageType === 'true') {
    effectiveDefense = 0;
    damage = Math.round(rawTotal);
  } else if (damageType === 'mixed') {
    effectiveDefense = Math.round((effArmor + effMR) / 2);
    damage = Math.round((rawTotal / 2) * armorMitigation(effArmor) + (rawTotal / 2) * mrMitigation(effMR));
  } else {
    effectiveDefense = Math.round(effMR);
    damage = Math.round(rawTotal * mrMitigation(effMR));
  }

  return {
    spellName: spell.name,
    label,
    rank,
    damage,
    damageType,
    components: [],
    fallback: {
      baseDamage: Math.round(baseDamage),
      apScaling: Math.round(apScaling),
      adScaling: Math.round(adScaling),
      effectiveDefense,
      rawTotal: Math.round(rawTotal),
    },
  };
}

/** tooltipの {{ eN }} を指定ランクの値で置換し、HTMLタグを除去する */
export function resolveTooltip(spell: ChampionSpell, rank: number): string {
  let tooltip = spell.tooltip || spell.description;

  // {{ eN }} → spell.effect[N][rank-1] のランク固有値
  if (spell.effect) {
    for (let i = 1; i < spell.effect.length; i++) {
      const arr = spell.effect[i];
      const val = arr?.[rank - 1];
      if (val != null) {
        tooltip = tooltip.replace(new RegExp(`\\{\\{\\s*e${i}\\s*\\}\\}`, 'gi'), String(val));
      }
    }
  }

  // vars の key → ランク固有の係数値
  if (spell.vars) {
    for (const v of spell.vars) {
      const coeff = Array.isArray(v.coeff) ? v.coeff[rank - 1] : v.coeff;
      if (coeff == null) continue;
      const pct = typeof coeff === 'number' && coeff > 0 && coeff <= 1
        ? `${Math.round(coeff * 100)}%`
        : String(coeff);
      tooltip = tooltip.replace(new RegExp(`\\{\\{\\s*${v.key}\\s*\\}\\}`, 'gi'), pct);
    }
  }

  // 残った {{ }} プレースホルダーを削除
  tooltip = tooltip.replace(/\{\{[^}]+\}\}/g, '');

  // HTMLタグを除去
  tooltip = tooltip
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  return tooltip.trim();
}

