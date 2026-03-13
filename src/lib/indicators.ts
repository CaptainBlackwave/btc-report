import {
  RSI,
  MACD,
  BollingerBands,
  SMA,
  EMA,
  Stochastic
} from 'technicalindicators';
import { Candle } from './binance';

export interface TechnicalIndicators {
  rsi: number | null;
  macd: {
    MACD: number;
    signal: number;
    histogram: number;
  } | null;
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  } | null;
  sma7: number | null;
  sma25: number | null;
  sma99: number | null;
  volatility: number;
  trend: 'bullish' | 'bearish' | 'neutral';
}

export function calculateIndicators(candles: Candle[]): TechnicalIndicators {
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const volumes = candles.map(c => c.volume);

  const rsiValues = RSI.calculate({
    values: closes,
    period: 14
  });
  const rsi = rsiValues.length > 0 ? rsiValues[rsiValues.length - 1] : null;

  const macdValues = MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 9,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  }).filter(m => m.MACD !== undefined && m.signal !== undefined);
  const lastMacd = macdValues.length > 0 ? macdValues[macdValues.length - 1] : null;
  const macd = lastMacd && lastMacd.MACD !== undefined ? {
    MACD: lastMacd.MACD,
    signal: lastMacd.signal!,
    histogram: lastMacd.histogram!
  } : null;

  const bbValues = BollingerBands.calculate({
    values: closes,
    period: 20,
    stdDev: 2
  });
  const bollingerBands = bbValues.length > 0 ? bbValues[bbValues.length - 1] : null;

  const sma7Values = SMA.calculate({ values: closes, period: 7 });
  const sma7 = sma7Values.length > 0 ? sma7Values[sma7Values.length - 1] : null;

  const sma25Values = SMA.calculate({ values: closes, period: 25 });
  const sma25 = sma25Values.length > 0 ? sma25Values[sma25Values.length - 1] : null;

  const sma99Values = SMA.calculate({ values: closes, period: 99 });
  const sma99 = sma99Values.length > 0 ? sma99Values[sma99Values.length - 1] : null;

  const returns = closes.slice(1).map((c, i) => (c - closes[i]) / closes[i]);
  const volatility = returns.length > 0 
    ? Math.sqrt(returns.reduce((sum, r) => sum + r * r, 0) / returns.length) * 100 
    : 0;

  let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (sma7 && sma25 && sma99) {
    if (sma7 > sma25 && sma25 > sma99) {
      trend = 'bullish';
    } else if (sma7 < sma25 && sma25 < sma99) {
      trend = 'bearish';
    }
  }

  return {
    rsi,
    macd,
    bollingerBands,
    sma7,
    sma25,
    sma99,
    volatility,
    trend
  };
}

export interface IndicatorChartData {
  time: number;
  close: number;
  sma7?: number;
  sma25?: number;
  sma99?: number;
  bbUpper?: number;
  bbMiddle?: number;
  bbLower?: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  macdHistogram?: number;
}

export function generateChartData(candles: Candle[]): IndicatorChartData[] {
  const closes = candles.map(c => c.close);
  const times = candles.map(c => c.time);

  const sma7Values = SMA.calculate({ values: closes, period: 7 });
  const sma25Values = SMA.calculate({ values: closes, period: 25 });
  const sma99Values = SMA.calculate({ values: closes, period: 99 });
  const bbValues = BollingerBands.calculate({ values: closes, period: 20, stdDev: 2 });
  const macdValues = MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 9,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  });
  const rsiValues = RSI.calculate({ values: closes, period: 14 });

  const offset = 99;
  const chartData: IndicatorChartData[] = [];

  for (let i = 0; i < candles.length; i++) {
    const dataPoint: IndicatorChartData = {
      time: times[i],
      close: closes[i]
    };

    const idx7 = i - (7 - 1);
    const idx25 = i - (25 - 1);
    const idx99 = i - (99 - 1);
    const idx20 = i - (20 - 1);
    const idx14 = i - (14 - 1);
    const idxMacd = i - 8;

    if (idx7 >= 0 && idx7 < sma7Values.length) {
      dataPoint.sma7 = sma7Values[idx7];
    }
    if (idx25 >= 0 && idx25 < sma25Values.length) {
      dataPoint.sma25 = sma25Values[idx25];
    }
    if (idx99 >= 0 && idx99 < sma99Values.length) {
      dataPoint.sma99 = sma99Values[idx99];
    }
    if (idx20 >= 0 && idx20 < bbValues.length) {
      dataPoint.bbUpper = bbValues[idx20].upper;
      dataPoint.bbMiddle = bbValues[idx20].middle;
      dataPoint.bbLower = bbValues[idx20].lower;
    }
    if (idxMacd >= 0 && idxMacd < macdValues.length) {
      dataPoint.macd = macdValues[idxMacd].MACD;
      dataPoint.macdSignal = macdValues[idxMacd].signal;
      dataPoint.macdHistogram = macdValues[idxMacd].histogram;
    }
    if (idx14 >= 0 && idx14 < rsiValues.length) {
      dataPoint.rsi = rsiValues[idx14];
    }

    chartData.push(dataPoint);
  }

  return chartData;
}
