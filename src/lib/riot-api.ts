import { Champion, ChampionDetail, ChampionDetailResponse, ChampionListResponse, Item, ItemListResponse, LeagueEntry, MerakiAbility, RiotAccount, Summoner } from './types';

const API_KEY = process.env.RIOT_API_KEY ?? '';
const REGION = process.env.RIOT_REGION ?? 'jp1';
const DDRAGON_BASE = 'https://ddragon.leagueoflegends.com';
const RIOT_BASE = `https://${REGION}.api.riotgames.com`;
const ACCOUNT_BASE = 'https://asia.api.riotgames.com';

// ---------- in-memory キャッシュ ----------
const _cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1時間

function cacheGet<T>(key: string): T | undefined {
  const entry = _cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) { _cache.delete(key); return undefined; }
  return entry.data as T;
}

function cacheSet<T>(key: string, data: T): T {
  _cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
  return data;
}

async function fetchWithKey<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'X-Riot-Token': API_KEY,
    },
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`Riot API error: ${res.status} ${res.statusText} for ${url}`);
  }
  return res.json() as Promise<T>;
}

async function fetchPublic<T>(url: string): Promise<T> {
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`Data Dragon error: ${res.status} ${res.statusText} for ${url}`);
  }
  return res.json() as Promise<T>;
}

export async function getLatestVersion(): Promise<string> {
  const cached = cacheGet<string>('version');
  if (cached) return cached;
  const versions = await fetchPublic<string[]>(`${DDRAGON_BASE}/api/versions.json`);
  return cacheSet('version', versions[0]);
}

export async function getChampionList(): Promise<Record<string, Champion>> {
  const cached = cacheGet<Record<string, Champion>>('championList');
  if (cached) return cached;
  const version = await getLatestVersion();
  const data = await fetchPublic<ChampionListResponse>(
    `${DDRAGON_BASE}/cdn/${version}/data/ja_JP/champion.json`
  );
  return cacheSet('championList', data.data);
}

export async function getChampionDetail(championId: string): Promise<ChampionDetail> {
  const cacheKey = `champion:${championId}`;
  const cached = cacheGet<ChampionDetail>(cacheKey);
  if (cached) return cached;
  const version = await getLatestVersion();

  interface MerakiChampionResponse {
    stats: { attackDamage: { perLevel: number } };
    abilities: {
      P?: MerakiAbility[];
      Q?: MerakiAbility[];
      W?: MerakiAbility[];
      E?: MerakiAbility[];
      R?: MerakiAbility[];
    };
  }

  const [data, merakiData] = await Promise.all([
    fetchPublic<ChampionDetailResponse>(
      `${DDRAGON_BASE}/cdn/${version}/data/ja_JP/champion/${championId}.json`
    ),
    fetch(
      `https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions/${championId}.json`,
      { next: { revalidate: 3600 } }
    )
      .then((r) => (r.ok ? (r.json() as Promise<MerakiChampionResponse>) : null))
      .catch(() => null),
  ]);

  const champion = data.data[championId];
  if (!champion) {
    throw new Error(`Champion not found: ${championId}`);
  }

  // Meraki から攻撃力成長値を上書き（Data Dragon では 0 が返るため）
  const merakiADPerLevel = merakiData?.stats?.attackDamage?.perLevel;
  if (merakiADPerLevel && merakiADPerLevel > 0) {
    champion.stats.attackdamageperlevel = merakiADPerLevel;
  }

  // Meraki からスキルデータを各スペルに付与
  const abilityKeys = ['Q', 'W', 'E', 'R'] as const;
  champion.spells.forEach((spell, i) => {
    const key = abilityKeys[i];
    const merakiAbility = merakiData?.abilities?.[key]?.[0];
    if (merakiAbility) {
      spell.merakiData = merakiAbility;
    }
  });

  return cacheSet(cacheKey, champion);
}

export function getChampionImageUrl(version: string, imageFull: string): string {
  return `${DDRAGON_BASE}/cdn/${version}/img/champion/${imageFull}`;
}

export function getSpellImageUrl(version: string, imageFull: string): string {
  return `${DDRAGON_BASE}/cdn/${version}/img/spell/${imageFull}`;
}

export function getProfileIconUrl(version: string, iconId: number): string {
  return `${DDRAGON_BASE}/cdn/${version}/img/profileicon/${iconId}.png`;
}

export async function getSummonerByName(summonerName: string): Promise<Summoner> {
  const encoded = encodeURIComponent(summonerName);
  return fetchWithKey<Summoner>(`${RIOT_BASE}/lol/summoner/v4/summoners/by-name/${encoded}`);
}

export async function getRiotAccount(gameName: string, tagLine: string): Promise<RiotAccount> {
  const encodedName = encodeURIComponent(gameName);
  const encodedTag = encodeURIComponent(tagLine);
  return fetchWithKey<RiotAccount>(
    `${ACCOUNT_BASE}/riot/account/v1/accounts/by-riot-id/${encodedName}/${encodedTag}`
  );
}

export async function getSummonerByPuuid(puuid: string): Promise<Summoner> {
  return fetchWithKey<Summoner>(`${RIOT_BASE}/lol/summoner/v4/summoners/by-puuid/${puuid}`);
}

export async function getLeagueEntries(summonerId: string): Promise<LeagueEntry[]> {
  return fetchWithKey<LeagueEntry[]>(
    `${RIOT_BASE}/lol/league/v4/entries/by-summoner/${summonerId}`
  );
}

export async function getItemList(): Promise<Item[]> {
  const cached = cacheGet<Item[]>('itemList');
  if (cached) return cached;
  const version = await getLatestVersion();
  const data = await fetchPublic<ItemListResponse>(
    `${DDRAGON_BASE}/cdn/${version}/data/ja_JP/item.json`
  );
  // 購入可能なアイテムをすべて返す（コンポーネントも含む）
  const items = Object.entries(data.data)
    .filter(([, item]) => item.gold.purchasable)
    .map(([id, item]) => ({ ...item, id }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ja'));
  return cacheSet('itemList', items);
}

export function getItemImageUrl(version: string, imageFull: string): string {
  return `${DDRAGON_BASE}/cdn/${version}/img/item/${imageFull}`;
}
