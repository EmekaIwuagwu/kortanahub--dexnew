import { NextResponse } from 'next/server';
import { getLiveStats } from '@/lib/stats-engine';

export async function GET() {
  try {
    const { syntheticPrice, finalVolume } = await getLiveStats();
    
    return NextResponse.json([{
      "trading_pairs": "DNR_USDCk",
      "base_currency": "DNR",
      "target_currency": "USDC.k",
      "last_price": syntheticPrice.toFixed(4),
      "lowest_ask": (syntheticPrice * 1.001).toFixed(4),
      "highest_bid": (syntheticPrice * 0.999).toFixed(4),
      "base_volume": (finalVolume / syntheticPrice).toFixed(2),
      "target_volume": finalVolume.toFixed(2),
      "price_change_24h": "4.22",
      "highest_price_24h": (syntheticPrice * 1.05).toFixed(4),
      "lowest_price_24h": (syntheticPrice * 0.95).toFixed(4)
    }]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
  }
}
