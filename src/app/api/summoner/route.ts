import { NextRequest, NextResponse } from 'next/server';
import { getRiotAccount, getSummonerByName, getSummonerByPuuid, getLeagueEntries, getLatestVersion } from '@/lib/riot-api';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const riotId = searchParams.get('riotId');
  const name = searchParams.get('name');

  if (!riotId && !name) {
    return NextResponse.json(
      { error: 'riotId または name パラメータが必要です' },
      { status: 400 }
    );
  }

  try {
    let summoner;

    if (riotId) {
      // riotId format: "PlayerName#JP1"
      const hashIndex = riotId.lastIndexOf('#');
      if (hashIndex === -1) {
        return NextResponse.json(
          { error: 'Riot IDの形式が正しくありません。例: PlayerName#JP1' },
          { status: 400 }
        );
      }
      const gameName = riotId.substring(0, hashIndex);
      const tagLine = riotId.substring(hashIndex + 1);

      const account = await getRiotAccount(gameName, tagLine);
      summoner = await getSummonerByPuuid(account.puuid);
    } else if (name) {
      summoner = await getSummonerByName(name!);
    }

    if (!summoner) {
      return NextResponse.json(
        { error: 'サモナーが見つかりませんでした' },
        { status: 404 }
      );
    }

    const [leagueEntries, version] = await Promise.all([
      getLeagueEntries(summoner.id),
      getLatestVersion(),
    ]);

    return NextResponse.json({ summoner, leagueEntries, version });
  } catch (error: unknown) {
    console.error('Failed to fetch summoner:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('404')) {
      return NextResponse.json(
        { error: 'サモナーが見つかりませんでした' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'サモナーデータの取得に失敗しました' },
      { status: 500 }
    );
  }
}
