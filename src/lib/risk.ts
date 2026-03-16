export interface RiskMetrics {
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  volatility: number;
  avgReturn: number;
  winRate: number;
  profitFactor: number;
  riskRewardRatio: number;
  calmarRatio: number;
}

export interface Trade {
  entryPrice: number;
  exitPrice: number;
  entryTime: number;
  exitTime: number;
  quantity: number;
  side: 'long' | 'short';
  pnl: number;
  pnlPercent: number;
}

export function calculateReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  return returns;
}

export function calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.02): number {
  if (returns.length < 2) return 0;
  
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const annualizedReturn = avgReturn * 252;
  
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  const annualizedStdDev = stdDev * Math.sqrt(252);
  
  if (annualizedStdDev === 0) return 0;
  
  return (annualizedReturn - riskFreeRate) / annualizedStdDev;
}

export function calculateSortinoRatio(returns: number[], riskFreeRate: number = 0.02): number {
  if (returns.length < 2) return 0;
  
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const annualizedReturn = avgReturn * 252;
  
  const downsideReturns = returns.filter(r => r < 0);
  if (downsideReturns.length === 0) return Infinity;
  
  const downsideVariance = downsideReturns.reduce((sum, r) => sum + r * r, 0) / downsideReturns.length;
  const downsideStdDev = Math.sqrt(downsideVariance) * Math.sqrt(252);
  
  if (downsideStdDev === 0) return 0;
  
  return (annualizedReturn - riskFreeRate) / downsideStdDev;
}

export function calculateMaxDrawdown(prices: number[]): { absolute: number; percent: number } {
  if (prices.length < 2) return { absolute: 0, percent: 0 };
  
  let maxPeak = prices[0];
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;
  
  for (const price of prices) {
    if (price > maxPeak) {
      maxPeak = price;
    }
    
    const drawdown = maxPeak - price;
    const drawdownPercent = (drawdown / maxPeak) * 100;
    
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownPercent = drawdownPercent;
    }
  }
  
  return { absolute: maxDrawdown, percent: maxDrawdownPercent };
}

export function calculateWinRate(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  const winningTrades = trades.filter(t => t.pnl > 0).length;
  return (winningTrades / trades.length) * 100;
}

export function calculateProfitFactor(trades: Trade[]): number {
  const grossProfit = trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
  
  if (grossLoss === 0) return grossProfit > 0 ? Infinity : 0;
  return grossProfit / grossLoss;
}

export function calculateRiskRewardRatio(trades: Trade[]): number {
  const winningTrades = trades.filter(t => t.pnl > 0);
  const losingTrades = trades.filter(t => t.pnl < 0);
  
  if (losingTrades.length === 0) return winningTrades.length > 0 ? Infinity : 0;
  
  const avgWin = winningTrades.length > 0 
    ? winningTrades.reduce((sum, t) => sum + t.pnlPercent, 0) / winningTrades.length 
    : 0;
  const avgLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnlPercent, 0) / losingTrades.length);
  
  if (avgLoss === 0) return Infinity;
  return avgWin / avgLoss;
}

export function calculateCalmarRatio(returns: number[], maxDrawdownPercent: number): number {
  if (maxDrawdownPercent === 0) return 0;
  
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const annualizedReturn = avgReturn * 252;
  
  return annualizedReturn / (maxDrawdownPercent / 100);
}

export function calculateRiskMetrics(trades: Trade[], prices: number[]): RiskMetrics {
  const returns = calculateReturns(prices);
  const { absolute: maxDrawdown, percent: maxDrawdownPercent } = calculateMaxDrawdown(prices);
  
  const sharpeRatio = calculateSharpeRatio(returns);
  const sortinoRatio = calculateSortinoRatio(returns);
  const volatility = returns.length > 0 ? Math.sqrt(returns.reduce((sum, r) => sum + r * r, 0) / returns.length) * Math.sqrt(252) * 100 : 0;
  const avgReturn = returns.length > 0 ? (returns.reduce((a, b) => a + b, 0) / returns.length) * 100 : 0;
  const winRate = calculateWinRate(trades);
  const profitFactor = calculateProfitFactor(trades);
  const riskRewardRatio = calculateRiskRewardRatio(trades);
  const calmarRatio = calculateCalmarRatio(returns, maxDrawdownPercent);
  
  return {
    sharpeRatio,
    sortinoRatio,
    maxDrawdown,
    maxDrawdownPercent,
    volatility,
    avgReturn,
    winRate,
    profitFactor,
    riskRewardRatio,
    calmarRatio
  };
}

export function getRiskGrade(metrics: RiskMetrics): { grade: string; color: string; description: string } {
  const { sharpeRatio, maxDrawdownPercent, winRate } = metrics;
  
  if (sharpeRatio >= 2 && maxDrawdownPercent < 15 && winRate >= 60) {
    return { grade: 'A+', color: '#00d4aa', description: 'Excellent risk-adjusted returns' };
  }
  if (sharpeRatio >= 1.5 && maxDrawdownPercent < 25 && winRate >= 55) {
    return { grade: 'A', color: '#00d4aa', description: 'Good risk-adjusted returns' };
  }
  if (sharpeRatio >= 1 && maxDrawdownPercent < 35 && winRate >= 50) {
    return { grade: 'B', color: '#f7931a', description: 'Average performance' };
  }
  if (sharpeRatio >= 0.5 && maxDrawdownPercent < 50) {
    return { grade: 'C', color: '#ffa502', description: 'Below average - consider adjusting' };
  }
  return { grade: 'D', color: '#ff4757', description: 'Poor risk-adjusted returns' };
}
