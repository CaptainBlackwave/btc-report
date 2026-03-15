import { NextResponse } from 'next/server';
import { fetchCandles } from '@/lib/binance';
import { detectMarketRegime, getRegimeLabel, getRegimeDescription } from '@/lib/regime';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const candles = await fetchCandles('BTCUSDT', '1h', 500);
    const regimeData = detectMarketRegime(candles);
    
    return NextResponse.json({
      ...regimeData,
      label: getRegimeLabel(regimeData.regime),
      description: getRegimeDescription(regimeData.regime)
    });
  } catch (error) {
    console.error('Error detecting market regime:', error);
    return NextResponse.json(
      { error: 'Failed to detect market regime' },
      { status: 500 }
    );
  }
}
