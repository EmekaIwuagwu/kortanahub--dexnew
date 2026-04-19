import { NextResponse } from 'next/server';
import { getLiveStats } from '@/lib/stats-engine';
import { CONTRACTS } from '@/lib/contracts';

export async function GET() {
  try {
    const { syntheticPrice, finalVolume } = await getLiveStats();
    
    return NextResponse.json({
      "DNR_USDCk": {
        "base_id": CONTRACTS.WDNR,
        "target_id": CONTRACTS.KORTUSD,
        "last_price": syntheticPrice.toFixed(4),
        "base_volume": (finalVolume / syntheticPrice).toFixed(2),
        "target_volume": finalVolume.toFixed(2),
        "bid": (syntheticPrice * 0.999).toFixed(4),
        "ask": (syntheticPrice * 1.001).toFixed(4),
        "high": (syntheticPrice * 1.02).toFixed(4),
        "low": (syntheticPrice * 0.98).toFixed(4)
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tickers" }, { status: 500 });
  }
}
