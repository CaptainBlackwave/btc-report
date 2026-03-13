import { NextResponse } from 'next/server';
import { fetchMarketData } from '@/lib/binance';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const marketData = await fetchMarketData();
    return NextResponse.json(marketData);
  } catch (error) {
    console.error('Error fetching market data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}
