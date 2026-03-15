'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface BacktestResult {
  date: string;
  actualPrice: number;
  predictedPrice: number;
}

interface BacktestMetrics {
  mae: number;
  mape: number;
  accuracy: number;
  totalPredictions: number;
  directionAccuracy: number;
}

interface BacktestChartProps {
  compact?: boolean;
}

export function BacktestChart({ compact = false }: BacktestChartProps) {
  const [data, setData] = useState<BacktestResult[]>([]);
  const [metrics, setMetrics] = useState<BacktestMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runBacktest = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/backtest');
      if (!res.ok) throw new Error('Backtest failed');
      const json = await res.json();
      setData(json.results);
      setMetrics(json.metrics);
    } catch (err) {
      setError('Failed to run backtest');
    } finally {
      setIsRunning(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    runBacktest();
  }, []);

  const formatPrice = (value: number) => {
    return `$${(value / 1000).toFixed(1)}k`;
  };

  if (loading || isRunning) {
    return (
      <div className="backtest-card">
        <div className="backtest-header">
          <h3>Model Backtesting</h3>
        </div>
        <div className="backtest-loading">
          <div className="backtest-spinner"></div>
          <p>Running backtest...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="backtest-card">
        <div className="backtest-header">
          <h3>Model Backtesting</h3>
          <button className="backtest-run-btn" onClick={runBacktest}>
            Retry
          </button>
        </div>
        <div className="backtest-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (compact) {
    return null;
  }

  return (
    <div className="backtest-card">
      <div className="backtest-header">
        <h3>Model Backtesting</h3>
        <button className="backtest-run-btn" onClick={runBacktest} disabled={isRunning}>
          {isRunning ? 'Running...' : 'Run Backtest'}
        </button>
      </div>

      {metrics && (
        <div className="backtest-metrics">
          <div className="metric-item">
            <span className="metric-label">MAE</span>
            <span className="metric-value">${metrics.mae.toFixed(2)}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">MAPE</span>
            <span className="metric-value">{metrics.mape.toFixed(2)}%</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Accuracy</span>
            <span className="metric-value">{metrics.accuracy.toFixed(1)}%</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Direction</span>
            <span className="metric-value">{metrics.directionAccuracy.toFixed(1)}%</span>
          </div>
        </div>
      )}

      <div className="backtest-chart">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis 
              dataKey="date" 
              stroke="#8b8b9a" 
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#2a2a3a' }}
            />
            <YAxis 
              stroke="#8b8b9a" 
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#2a2a3a' }}
              tickFormatter={formatPrice}
              domain={['auto', 'auto']}
            />
            <Tooltip 
              contentStyle={{ 
                background: '#12121a', 
                border: '1px solid #2a2a3a',
                borderRadius: '8px',
                color: '#e8e8ed'
              }}
              formatter={(value) => [`$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, '']}
              cursor={{ stroke: '#f7931a', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={(value) => (
                <span style={{ color: '#e8e8ed', fontSize: '12px' }}>
                  {value === 'actualPrice' ? 'Actual Price' : 'Predicted Price'}
                </span>
              )}
            />
            <Line 
              type="monotone" 
              dataKey="actualPrice" 
              stroke="#f7931a" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: '#f7931a', stroke: '#fff', strokeWidth: 2 }}
              name="actualPrice"
            />
            <Line 
              type="monotone" 
              dataKey="predictedPrice" 
              stroke="#00d4aa" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 6, fill: '#00d4aa', stroke: '#fff', strokeWidth: 2 }}
              name="predictedPrice"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="backtest-info">
        <p>
          <strong>{metrics?.totalPredictions}</strong> predictions tested on 20% of historical data
        </p>
      </div>
    </div>
  );
}
