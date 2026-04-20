import { NextResponse } from 'next/server';
import { getLiveStats } from '@/lib/stats-engine';

export async function GET() {
  try {
    const { instruments } = await getLiveStats();
    return NextResponse.json(instruments);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch instruments" }, { status: 500 });
  }
}
