import { NextResponse } from 'next/server';
import { getOrderBook } from '@/lib/stats-engine';

export async function GET() {
  try {
    const depth = await getOrderBook();
    return NextResponse.json(depth);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch order book" }, { status: 500 });
  }
}
