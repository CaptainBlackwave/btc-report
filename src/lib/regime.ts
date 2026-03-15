import { Candle } from './binance';

export type MarketRegime = 'trending' | 'mean-reverting' | 'volatile' | 'consolidating';

export interface RegimeData {
  regime: MarketRegime;
  volatility: number;
  volatilityPercentile: number;
  smaDistance: number;
  bollingerPosition: number;
  trendStrength: number;
  confidence: number;
}

export function calculateRealizedVolatility(candles: Candle[], period: number = 30): number {
  if (candles.length < period) return 0;
  
  const returns: number[] = [];
  for (let i = candles.length - period; i < candles.length - 1; i++) {
    const ret = (candles[i + 1].close - candles[i].close) / candles[i].close;
    returns.push(ret);
  }
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / returns.length;
  
  return Math.sqrt(variance * 252) * 100;
}

export function calculateSMA(candles: Candle[], period: number = 30): number {
  if (candles.length < period) return 0;
  
  const slice = candles.slice(-period);
  return slice.reduce((sum, c) => sum + c.close, 0) / period;
}

export function calculateBollingerBands(candles: Candle[], period: number = 20, stdDev: number = 2): {
  upper: number;
  middle: number;
  lower: number;
} {
  if (candles.length < period) {
    const lastPrice = candles[candles.length - 1]?.close || 0;
    return { upper: lastPrice, middle: lastPrice, lower: lastPrice };
  }
  
  const slice = candles.slice(-period);
  const sma = slice.reduce((sum, c) => sum + c.close, 0) / period;
  
  const squaredDiffs = slice.map(c => Math.pow(c.close - sma, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const std = Math.sqrt(variance);
  
  return {
    upper: sma + stdDev * std,
    middle: sma,
    lower: sma - stdDev * std
  };
}

export function calculateTrendStrength(candles: Candle[], period: number = 30): number {
  if (candles.length < period) return 0;
  
  const slice = candles.slice(-period);
  const firstPrice = slice[0].close;
  const lastPrice = slice[slice.length - 1].close;
  const sma = calculateSMA(candles, period);
  
  const priceChange = (lastPrice - firstPrice) / firstPrice;
  const distanceFromSMA = Math.abs(lastPrice - sma) / sma;
  
  const trendScore = Math.abs(priceChange) * 100 - distanceFromSMA * 5;
  return Math.max(0, Math.min(100, trendScore + 50));
}

export function detectMarketRegime(candles: Candle[]): RegimeData {
  const volatility = calculateRealizedVolatility(candles, 30);
  const sma30 = calculateSMA(candles, 30);
  const sma7 = calculateSMA(candles, 7);
  const currentPrice = candles[candles.length - 1].close;
  const bb = calculateBollingerBands(candles, 20, 2);
  
  const smaDistance = Math.abs(currentPrice - sma30) / sma30 * 100;
  
  const bollingerRange = bb.upper - bb.lower;
  const bollingerPosition = bollingerRange > 0 
    ? (currentPrice - bb.lower) / bollingerRange 
    : 0.5;
  
  const trendStrength = calculateTrendStrength(candles, 30);
  
  let volatilityPercentile: number;
  if (volatility < 30) {
    volatilityPercentile = 20;
  } else if (volatility < 60) {
    volatilityPercentile = 50;
  } else if (volatility < 100) {
    volatilityPercentile = 75;
  } else {
    volatilityPercentile = 95;
  }
  
  let regime: MarketRegime;
  let confidence: number;
  
  if (volatility < 25 && smaDistance < 2) {
    regime = 'mean-reverting';
    confidence = Math.max(0.7, 1 - volatility / 50);
  } else if (volatility > 60 || bollingerPosition > 0.9 || bollingerPosition < 0.1) {
    regime = 'volatile';
    confidence = Math.min(0.8, volatility / 100 + 0.3);
  } else if (trendStrength > 60) {
    regime = 'trending';
    confidence = trendStrength / 100;
  } else {
    regime = 'consolidating';
    confidence = 0.6;
  }
  
  return {
    regime,
    volatility,
    volatilityPercentile,
    smaDistance,
    bollingerPosition,
    trendStrength,
    confidence
  };
}

export function getRegimeLabel(regime: MarketRegime): string {
  switch (regime) {
    case 'trending':
      return 'Trending';
    case 'mean-reverting':
      return 'Mean Reverting';
    case 'volatile':
      return 'Volatile';
    case 'consolidating':
      return 'Consolidating';
    default:
      return 'Unknown';
  }
}

export function getRegimeDescription(regime: MarketRegime): string {
  switch (regime) {
    case 'trending':
      return 'Strong directional movement detected. Use trend-following strategies.';
    case 'mean-reverting':
      return 'Price oscillating around SMA. Mean reversion strategies may work.';
    case 'volatile':
      return 'High volatility detected. Consider reduced position sizes.';
    case 'consolidating':
      return 'Price in tight range. Range-bound strategies may apply.';
    default:
      return '';
  }
}
