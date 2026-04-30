'use client';

interface Props {
  level: number;
  onChange: (level: number) => void;
}

export default function LevelSelector({ level, onChange }: Props) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-yellow-400 font-semibold whitespace-nowrap">
        レベル: <span className="text-white text-xl">{level}</span>
      </label>
      <input
        type="range"
        min={1}
        max={18}
        value={level}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-yellow-500"
      />
      <div className="flex gap-1">
        <span className="text-gray-400 text-sm">1</span>
        <span className="text-gray-400 text-sm">—</span>
        <span className="text-gray-400 text-sm">18</span>
      </div>
    </div>
  );
}
