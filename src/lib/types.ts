export interface Champion {
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: {
    attack: number;
    defense: number;
    magic: number;
    difficulty: number;
  };
  image: {
    full: string;
    sprite: string;
    group: string;
    x: number;
    y: number;
    w: number;
    h: number;
  };
  tags: string[];
  partype: string;
  stats: ChampionStats;
}

export interface ChampionStats {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
}

export interface ChampionDetail extends Champion {
  lore: string;
  allytips: string[];
  enemytips: string[];
  spells: ChampionSpell[];
  passive: {
    name: string;
    description: string;
    image: {
      full: string;
      sprite: string;
      group: string;
      x: number;
      y: number;
      w: number;
      h: number;
    };
  };
  recommended: unknown[];
}

export interface MerakiAbilityModifier {
  values: number[];
  units: string[];
}

export interface MerakiAbilityLeveling {
  attribute: string;
  modifiers: MerakiAbilityModifier[];
}

export interface MerakiAbilityEffect {
  description: string;
  leveling: MerakiAbilityLeveling[];
}

export interface MerakiAbility {
  name: string;
  effects: MerakiAbilityEffect[];
  cost?: { modifiers: MerakiAbilityModifier[] };
  cooldown?: { modifiers: MerakiAbilityModifier[] };
  damageType?: string;
}

export interface ChampionSpell {
  id: string;
  name: string;
  description: string;
  tooltip: string;
  leveltip: {
    label: string[];
    effect: string[];
  };
  maxrank: number;
  cooldown: number[];
  cooldownBurn: string;
  cost: number[];
  costBurn: string;
  datavalues: Record<string, unknown>;
  effect: (number[] | null)[];
  effectBurn: (string | null)[];
  vars: SpellVar[];
  costType: string;
  maxammo: string;
  range: number[];
  rangeBurn: string;
  image: {
    full: string;
    sprite: string;
    group: string;
    x: number;
    y: number;
    w: number;
    h: number;
  };
  resource: string;
  /** Meraki Analytics から補完した詳細スペルデータ */
  merakiData?: MerakiAbility;
}

export interface SpellVar {
  link: string;
  coeff: number | number[];
  key: string;
}

export interface Summoner {
  id: string;
  accountId: string;
  puuid: string;
  name: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface LeagueEntry {
  leagueId: string;
  summonerId: string;
  summonerName: string;
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
  veteran: boolean;
  freshBlood: boolean;
  inactive: boolean;
  miniSeries?: {
    target: number;
    wins: number;
    losses: number;
    progress: string;
  };
}

export interface ChampionListResponse {
  type: string;
  format: string;
  version: string;
  data: Record<string, Champion>;
}

export interface ChampionDetailResponse {
  type: string;
  format: string;
  version: string;
  data: Record<string, ChampionDetail>;
}

export interface ItemStats {
  FlatPhysicalDamageMod?: number;       // ボーナスAD
  FlatMagicDamageMod?: number;          // AP
  FlatArmorMod?: number;                // アーマー
  FlatSpellBlockMod?: number;           // MR
  FlatHPPoolMod?: number;               // HP
  FlatMPPoolMod?: number;               // マナ
  FlatCritChanceMod?: number;           // クリティカル確率
  PercentAttackSpeedMod?: number;       // 攻撃速度%
  FlatMovementSpeedMod?: number;        // 移動速度(固定)
  PercentMovementSpeedMod?: number;     // 移動速度%
  FlatArmorPenetrationMod?: number;     // レシリエンス(固定アーマー貫通)
  PercentArmorPenetrationMod?: number;  // アーマー貫通%
  PercentMagicPenetrationMod?: number;  // 魔法貫通%
  FlatMagicPenetrationMod?: number;     // 固定魔法貫通
  FlatHPRegenMod?: number;
  FlatMPRegenMod?: number;
  PercentLifeStealMod?: number;
  PercentSpellVampMod?: number;
  FlatPhysicalDamageShieldMod?: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  plaintext: string;
  image: {
    full: string;
    sprite: string;
    group: string;
    x: number;
    y: number;
    w: number;
    h: number;
  };
  gold: {
    base: number;
    purchasable: boolean;
    total: number;
    sell: number;
  };
  tags: string[];
  maps: Record<string, boolean>;
  stats: ItemStats;
  depth?: number;
  into?: string[];
  from?: string[];
}

export interface ItemListResponse {
  type: string;
  format: string;
  version: string;
  data: Record<string, Omit<Item, 'id'>>;
}

// アイテム選択で使用するボーナスステータスのサマリ
export interface BonusStats {
  bonusAD: number;
  ap: number;
  armor: number;
  mr: number;
  hp: number;
  lethality: number;          // フラットアーマー貫通(レシリエンス)
  armorPenPct: number;        // アーマー貫通%
  magicPenFlat: number;       // フラット魔法貫通
  magicPenPct: number;        // 魔法貫通%
  critChance: number;         // クリティカル確率(0~1)
  attackSpeedPct: number;     // 攻撃速度ボーナス%
}
