'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart
} from 'recharts';

interface PredictionData {
  predictions: number[];
  confidence: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  modelUsed: 'lstm' | 'random-forest';
  currentPrice: number;
  indicators: {
    rsi: number | null;
    volatility: number;
    trend: string;
  };
}

import { IndicatorChartData } from '@/lib/indicators';
import { ModelSettings, defaultModelSettings } from './ModelSettingsCard';

interface PredictionChartProps {
  onPredict: () => void;
  onPredictComplete: () => void;
  isLoading: boolean;
  chartData?: IndicatorChartData[];
  modelSettings?: ModelSettings;
  onSettingsChange?: (settings: ModelSettings) => void;
}

export function PredictionChart({ 
  onPredict, 
  onPredictComplete, 
  isLoading, 
  chartData: externalChartData,
  modelSettings = defaultModelSettings
}: PredictionChartProps) {
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [chartData, setChartData] = useState<{ time: string; price: number; type: 'historical' | 'predicted' }[]>([]);

  useEffect(() => {
    if (externalChartData && externalChartData.length > 0) {
      const historical = externalChartData.slice(-48).map((c) => ({
        time: new Date(c.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        price: c.close,
        type: 'historical' as const
      }));
      setChartData(historical);
    }
  }, [externalChartData]);

  const runPrediction = async () => {
    onPredict();
    try {
      const params = new URLSearchParams({
        epochs: modelSettings.epochs.toString(),
        batchSize: modelSettings.batchSize.toString(),
        learningRate: modelSettings.learningRate.toString(),
        lookback: modelSettings.lookback.toString()
      });
      
      const res = await fetch(`/api/predict?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPrediction(data);
        
        const now = new Date();
        const predicted: { time: string; price: number; type: 'historical' | 'predicted' }[] = [];
        
        for (let i = 0; i < 5; i++) {
          const predTime = new Date(now.getTime() + (i + 1) * 60 * 60 * 1000);
          predicted.push({
            time: predTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            price: data.predictions[i],
            type: 'predicted'
          });
        }
        
        setChartData(prev => {
          const historical = prev.slice(-24);
          return [...historical, ...predicted];
        });
      }
    } catch (err) {
      console.error('Prediction failed:', err);
    } finally {
      onPredictComplete();
    }
  };

  const historicalData = chartData.filter(d => d.type === 'historical');
  const predictedData = chartData.filter(d => d.type === 'predicted');
  const trendColor = prediction?.trend === 'bullish' ? '#00d4aa' : prediction?.trend === 'bearish' ? '#ff4757' : '#f7931a';

  return (
    <div className="prediction-panel">
      <div className="prediction-header">
        <h2>Price Prediction</h2>
        <button 
          className={`predict-btn ${isLoading ? 'loading' : ''}`} 
          onClick={runPrediction}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Analyzing...
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              Predict
            </>
          )}
        </button>
      </div>

      {isLoading && (
        <div className="training-progress">
          <div className="progress-header">
            <span className="progress-label">Training Model...</span>
            <span className="progress-value">{modelSettings.modelType === 'lstm' ? 'LSTM' : 'Random Forest'}</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar progress-bar-indeterminate" />
          </div>
          <div className="progress-stats">
            <span>Epochs: {modelSettings.epochs}</span>
            <span>Batch: {modelSettings.batchSize}</span>
          </div>
        </div>
      )}

      {prediction && (
        <div className="prediction-results">
          <div className="result-main">
            <span className="result-label">5h Prediction</span>
            <span className="result-price" style={{ color: trendColor }}>
              ${prediction.predictions[prediction.predictions.length - 1].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="result-stats">
            <div className="stat">
              <span className="stat-label">Confidence</span>
              <span className="stat-value">{prediction.confidence.toFixed(0)}%</span>
            </div>
            <div className="stat">
              <span className="stat-label">Model</span>
              <span className="stat-value model">{prediction.modelUsed.toUpperCase()}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Trend</span>
              <span className={`stat-value trend ${prediction.trend}`}>{prediction.trend.toUpperCase()}</span>
            </div>
          </div>

          <div className="prediction-list">
            {prediction.predictions.map((price, i) => (
              <div key={i} className="prediction-item">
                <span className="pred-time">+{i + 1}h</span>
                <span className="pred-price" style={{ color: price > prediction.currentPrice ? '#00d4aa' : '#ff4757' }}>
                  ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="pred-change" style={{ color: price > prediction.currentPrice ? '#00d4aa' : '#ff4757' }}>
                  {((price - prediction.currentPrice) / prediction.currentPrice * 100).toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="predGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f7931a" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f7931a" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              stroke="#8b8b9a" 
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#2a2a3a' }}
            />
            <YAxis 
              stroke="#8b8b9a" 
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#2a2a3a' }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              domain={['auto', 'auto']}
            />
            <Tooltip 
              contentStyle={{ 
                background: '#12121a', 
                border: '1px solid #2a2a3a',
                borderRadius: '8px',
                color: '#e8e8ed'
              }}
              formatter={(value, name, props) => {
                const type = props.payload.type;
                const label = type === 'historical' ? 'Historical' : 'Predicted';
                return [`$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, label];
              }}
              labelFormatter={(label) => label}
              cursor={{ stroke: '#f7931a', strokeWidth: 1, strokeDasharray: '4 4' }}
              isAnimationActive={false}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              data={historicalData}
              stroke="#f7931a" 
              strokeWidth={2}
              fill="url(#predGradient)"
              dot={false}
              activeDot={{ r: 6, fill: '#f7931a', stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive={false}
            />
            {predictedData.length > 0 && (
              <Line 
                type="monotone" 
                dataKey="price" 
                data={predictedData}
                stroke={trendColor}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 6, fill: trendColor, stroke: '#fff', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {!prediction && !isLoading && (
        <div className="empty-state">
          <p>Click &quot;Predict&quot; to run the AI models and generate a 5-hour price forecast.</p>
        </div>
      )}
    </div>
  );
}
