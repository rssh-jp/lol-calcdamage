import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-gray-900 border-b border-yellow-600/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16 gap-8">
          <Link href="/" className="text-yellow-400 font-bold text-xl">
            LoL Damage Calc
          </Link>
          <div className="flex gap-6">
            <Link href="/" className="text-gray-300 hover:text-yellow-400 transition-colors">
              ダメージ計算
            </Link>
            <Link href="/champions" className="text-gray-300 hover:text-yellow-400 transition-colors">
              チャンピオン一覧
            </Link>
            <Link href="/summoner" className="text-gray-300 hover:text-yellow-400 transition-colors">
              サモナー検索
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
