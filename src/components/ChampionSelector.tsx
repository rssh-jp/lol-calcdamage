'use client';

import { Champion } from '@/lib/types';
import { useState } from 'react';

interface Props {
  champions: Champion[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function ChampionSelector({ champions, selectedId, onSelect }: Props) {
  const [search, setSearch] = useState('');

  const filtered = champions.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        placeholder="チャンピオン名で検索..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="lol-input w-full"
      />
      <select
        value={selectedId}
        onChange={(e) => onSelect(e.target.value)}
        className="lol-select w-full h-48"
        size={8}
      >
        <option value="">-- チャンピオンを選択 --</option>
        {filtered.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.id})
          </option>
        ))}
      </select>
    </div>
  );
}
