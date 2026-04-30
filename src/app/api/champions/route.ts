import { NextResponse } from 'next/server';
import { getChampionList, getLatestVersion } from '@/lib/riot-api';

export async function GET() {
  try {
    const [champions, version] = await Promise.all([
      getChampionList(),
      getLatestVersion(),
    ]);

    const list = Object.values(champions).sort((a, b) =>
      a.name.localeCompare(b.name, 'ja')
    );

    return NextResponse.json({ champions: list, version });
  } catch (error) {
    console.error('Failed to fetch champion list:', error);
    return NextResponse.json(
      { error: 'チャンピオンデータの取得に失敗しました' },
      { status: 500 }
    );
  }
}
