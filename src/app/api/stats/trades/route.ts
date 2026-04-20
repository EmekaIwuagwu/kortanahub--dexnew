import { NextResponse } from 'next/server';
import { getRecentTrades } from '@/lib/stats-engine';

export async function GET() {
  try {
    const trades = await getRecentTrades(50);
    return NextResponse.json(trades);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch trade history" }, { status: 500 });
  }
}
