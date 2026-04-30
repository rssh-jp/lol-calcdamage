import { NextRequest, NextResponse } from 'next/server';
import { getChampionDetail, getLatestVersion } from '@/lib/riot-api';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [champion, version] = await Promise.all([
      getChampionDetail(params.id),
      getLatestVersion(),
    ]);

    return NextResponse.json({ champion, version });
  } catch (error) {
    console.error(`Failed to fetch champion ${params.id}:`, error);
    return NextResponse.json(
      { error: 'チャンピオンデータの取得に失敗しました' },
      { status: 500 }
    );
  }
}
