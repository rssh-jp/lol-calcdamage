'use client';

import { LeagueEntry, Summoner } from '@/lib/types';
import { useState } from 'react';
import SummonerCard from './SummonerCard';

export default function SummonerSearch() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    summoner: Summoner;
    leagueEntries: LeagueEntry[];
    version: string;
  } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const params = new URLSearchParams({ riotId: input.trim() });
      const res = await fetch(`/api/summoner?${params}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || '検索に失敗しました');
      }

      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '検索に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Player#JP1"
          className="lol-input flex-1"
        />
        <button
          type="submit"
          disabled={loading}
          className="lol-button disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '検索中...' : '検索'}
        </button>
      </form>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-400 mb-4">
          {error}
        </div>
      )}

      {result && (
        <SummonerCard
          summoner={result.summoner}
          leagueEntries={result.leagueEntries}
          version={result.version}
        />
      )}
    </div>
  );
}
