import { NextResponse } from 'next/server';
import { fetchMultiTimeframeData, TIMEFRAMES, Candle } from '@/lib/binance';
import { calculateIndicators, generateChartData, TechnicalIndicators } from '@/lib/indicators';

export const dynamic = 'force-dynamic';

interface TimeframeIndicators {
  indicators: TechnicalIndicators;
  chartData: ReturnType<typeof generateChartData>;
  lastCandle: Candle;
}

export async function GET() {
  try {
    const multiTimeframeData = await fetchMultiTimeframeData('BTCUSDT', TIMEFRAMES, 500);
    
    const results: Record<string, TimeframeIndicators> = {};
    
    for (const interval of TIMEFRAMES) {
      const candles = multiTimeframeData[interval];
      if (candles && candles.length > 0) {
        results[interval] = {
          indicators: calculateIndicators(candles),
          chartData: generateChartData(candles),
          lastCandle: candles[candles.length - 1]
        };
      }
    }
    
    return NextResponse.json({
      timeframes: results,
      availableTimeframes: TIMEFRAMES
    });
  } catch (error) {
    console.error('Error fetching multi-timeframe data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch multi-timeframe data' },
      { status: 500 }
    );
  }
}
