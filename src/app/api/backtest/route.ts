import { NextResponse } from 'next/server';
import { fetchCandles } from '@/lib/binance';
import { runBacktest } from '@/lib/backtest';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const candles = await fetchCandles('BTCUSDT', '1h', 500);
    
    if (!candles || candles.length < 200) {
      return NextResponse.json(
        { error: 'Insufficient data for backtesting' },
        { status: 400 }
      );
    }
    
    const result = await runBacktest(candles, { lookback: 24 });
    
    return NextResponse.json({
      results: result.results.slice(-50),
      metrics: {
        mae: result.mae,
        mape: result.mape,
        accuracy: result.accuracy,
        totalPredictions: result.totalPredictions,
        directionAccuracy: result.directionAccuracy
      }
    });
  } catch (error) {
    console.error('Backtest error:', error);
    return NextResponse.json(
      { error: 'Failed to run backtest' },
      { status: 500 }
    );
  }
}
