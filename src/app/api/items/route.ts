import { getItemList, getLatestVersion } from '@/lib/riot-api';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [items, version] = await Promise.all([getItemList(), getLatestVersion()]);
    return NextResponse.json({ items, version });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
