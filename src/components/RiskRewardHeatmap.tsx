'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';

interface RiskRewardHeatmapProps {
  currentVolatility: number;
  predictedReturn: number;
  historicalData?: { volatility: number; returns: number }[];
}

interface HeatmapPoint {
  volatility: number;
  return: number;
  color: string;
  label: string;
}

export function RiskRewardHeatmap({ 
  currentVolatility, 
  predictedReturn,
  historicalData = [] 
}: RiskRewardHeatmapProps) {
  const heatmapData = useMemo(() => {
    const points: HeatmapPoint[] = [];
    
    for (let vol = 10; vol <= 120; vol += 10) {
      for (let ret = -10; ret <= 10; ret += 2) {
        const riskReward = ret / (vol || 1);
        
        let color: string;
        let label: string;
        
        if (vol > 80) {
          color = 'rgba(255, 71, 87, 0.7)';
          label = 'High Risk';
        } else if (vol > 50) {
          if (ret > 2) {
            color = 'rgba(247, 147, 26, 0.7)';
            label = 'Moderate';
          } else if (ret < -2) {
            color = 'rgba(255, 71, 87, 0.5)';
            label = 'Negative';
          } else {
            color = 'rgba(139, 139, 154, 0.5)';
            label = 'Neutral';
          }
        } else {
          if (ret > 3) {
            color = 'rgba(0, 212, 170, 0.7)';
            label = 'Favorable';
          } else if (ret > 0) {
            color = 'rgba(0, 212, 170, 0.4)';
            label = 'Low Risk';
          } else {
            color = 'rgba(255, 71, 87, 0.3)';
            label = 'Caution';
          }
        }
        
        points.push({ volatility: vol, return: ret, color, label });
      }
    }
    
    return points;
  }, []);

  const currentPosition = useMemo(() => {
    return {
      volatility: currentVolatility,
      return: predictedReturn * 100
    };
  }, [currentVolatility, predictedReturn]);

  const riskZone = useMemo(() => {
    if (currentVolatility > 80) return 'high';
    if (currentVolatility > 50) return 'medium';
    return 'low';
  }, [currentVolatility]);

  const recommendation = useMemo(() => {
    if (riskZone === 'high' && predictedReturn < 0) {
      return { text: 'Reduce Position Size', color: '#ff4757' };
    }
    if (riskZone === 'high') {
      return { text: 'Caution Advised', color: '#ffa502' };
    }
    if (predictedReturn > 0) {
      return { text: 'Favorable Conditions', color: '#00d4aa' };
    }
    return { text: 'Hold / Wait', color: '#8b8b9a' };
  }, [riskZone, predictedReturn]);

  return (
    <div className="risk-heatmap">
      <div className="heatmap-header">
        <h4>Risk-Reward Map</h4>
        <span className="recommendation" style={{ color: recommendation.color }}>
          {recommendation.text}
        </span>
      </div>

      <div className="heatmap-chart">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={heatmapData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff4757" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#f7931a" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#00d4aa" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="volatility" 
              type="number"
              domain={[0, 120]}
              tick={{ fontSize: 9, fill: '#8b8b9a' }}
              axisLine={{ stroke: '#2a2a3a' }}
              tickLine={false}
              label={{ value: 'Volatility %', position: 'bottom', fontSize: 9, fill: '#8b8b9a' }}
            />
            <YAxis 
              dataKey="return" 
              type="number"
              domain={[-10, 10]}
              tick={{ fontSize: 9, fill: '#8b8b9a' }}
              axisLine={{ stroke: '#2a2a3a' }}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip 
              contentStyle={{ 
                background: '#12121a', 
                border: '1px solid #2a2a3a',
                borderRadius: '8px',
                fontSize: '11px'
              }}
              formatter={(value, name) => {
                const numVal = Number(value);
                if (name === 'volatility') return [`${numVal}%`, 'Volatility'];
                if (name === 'return') return [`${numVal.toFixed(1)}%`, 'Return'];
                return [value, name];
              }}
            />
            <ReferenceLine x={currentVolatility} stroke="#f7931a" strokeDasharray="3 3" />
            <ReferenceLine y={predictedReturn * 100} stroke="#f7931a" strokeDasharray="3 3" />
            <Area 
              type="monotone" 
              dataKey="return" 
              stroke="none"
              fill="url(#riskGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="heatmap-legend">
        <div className="legend-item">
          <span className="legend-color low-risk"></span>
          <span>Low Risk / High Return</span>
        </div>
        <div className="legend-item">
          <span className="legend-color medium-risk"></span>
          <span>Moderate</span>
        </div>
        <div className="legend-item">
          <span className="legend-color high-risk"></span>
          <span>High Risk</span>
        </div>
      </div>

      <div className="current-position">
        <div className="position-marker">
          <span className="marker-label">Current Position</span>
          <span className="marker-values">
            Vol: {currentVolatility.toFixed(1)}% | Ret: {(predictedReturn * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
