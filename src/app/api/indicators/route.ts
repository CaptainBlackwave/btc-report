import { NextResponse } from 'next/server';
import { fetchCandles } from '@/lib/binance';
import { calculateIndicators, generateChartData } from '@/lib/indicators';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const candles = await fetchCandles('BTCUSDT', '1h', 200);
    const indicators = calculateIndicators(candles);
    const chartData = generateChartData(candles);
    
    return NextResponse.json({
      indicators,
      chartData,
      lastCandle: candles[candles.length - 1]
    });
  } catch (error) {
    console.error('Error calculating indicators:', error);
    return NextResponse.json(
      { error: 'Failed to calculate indicators' },
      { status: 500 }
    );
  }
}
