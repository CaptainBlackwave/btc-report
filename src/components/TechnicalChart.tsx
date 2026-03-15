'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Bar
} from 'recharts';

import { IndicatorChartData } from '@/lib/indicators';

interface ChartData {
  time: number;
  close: number;
  sma7?: number;
  sma25?: number;
  sma99?: number;
  bbUpper?: number;
  bbMiddle?: number;
  bbLower?: number;
  macdHistogram?: number;
}

interface TechnicalChartProps {
  chartData?: IndicatorChartData[];
}

export function TechnicalChart({ chartData: externalChartData }: TechnicalChartProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSMA, setShowSMA] = useState(true);
  const [showBB, setShowBB] = useState(false);
  const [showMACD, setShowMACD] = useState(false);

  useEffect(() => {
    if (externalChartData && externalChartData.length > 0) {
      setData(externalChartData);
      setLoading(false);
    } else {
      const fetchData = async () => {
        try {
          const res = await fetch('/api/indicators');
          if (res.ok) {
            const json = await res.json();
            setData(json.chartData || []);
          }
        } catch (err) {
          console.error('Failed to fetch chart data:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [externalChartData]);

  const chartData = data.slice(-100).map(d => ({
    time: new Date(d.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    close: d.close,
    sma7: d.sma7,
    sma25: d.sma25,
    sma99: d.sma99,
    bbUpper: d.bbUpper,
    bbMiddle: d.bbMiddle,
    bbLower: d.bbLower,
    macd: d.macdHistogram
  }));

  return (
    <div className="technical-panel">
      <div className="technical-header">
        <h2>Technical Analysis</h2>
        <div className="chart-toggles">
          <button 
            className={`toggle-btn ${showSMA ? 'active' : ''}`}
            onClick={() => setShowSMA(!showSMA)}
          >
            SMA
          </button>
          <button 
            className={`toggle-btn ${showBB ? 'active' : ''}`}
            onClick={() => setShowBB(!showBB)}
          >
            BB
          </button>
          <button 
            className={`toggle-btn ${showMACD ? 'active' : ''}`}
            onClick={() => setShowMACD(!showMACD)}
          >
            MACD
          </button>
        </div>
      </div>

      {loading && (
        <div className="chart-loading">
          <div className="spinner large"></div>
          <p>Loading chart data...</p>
        </div>
      )}

      {!loading && (
        <>
          <div className="chart-container technical">
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis 
                  dataKey="time" 
                  stroke="#8b8b9a" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#2a2a3a' }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="#8b8b9a" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#2a2a3a' }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: '#12121a', 
                    border: '1px solid #2a2a3a',
                    borderRadius: '8px',
                    color: '#e8e8ed'
                  }}
                  labelStyle={{ color: '#8b8b9a' }}
                  cursor={{ stroke: '#f7931a', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Legend />

                {showBB && (
                  <>
                    <Line type="monotone" dataKey="bbUpper" stroke="#ff4757" strokeWidth={1} dot={false} strokeDasharray="3 3" name="BB Upper" activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="bbMiddle" stroke="#ffa502" strokeWidth={1} dot={false} name="BB Middle" activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="bbLower" stroke="#00d4aa" strokeWidth={1} dot={false} strokeDasharray="3 3" name="BB Lower" activeDot={{ r: 4 }} />
                  </>
                )}

                {showSMA && (
                  <>
                    <Line type="monotone" dataKey="sma7" stroke="#00d4aa" strokeWidth={1.5} dot={false} name="SMA 7" activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="sma25" stroke="#f7931a" strokeWidth={1.5} dot={false} name="SMA 25" activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="sma99" stroke="#9b59b6" strokeWidth={1.5} dot={false} name="SMA 99" activeDot={{ r: 4 }} />
                  </>
                )}

                <Line 
                  type="monotone" 
                  dataKey="close" 
                  stroke="#e8e8ed" 
                  strokeWidth={2} 
                  dot={false} 
                  name="Price"
                  activeDot={{ r: 6, fill: '#e8e8ed', stroke: '#fff', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {showMACD && (
            <div className="macd-chart">
              <h4>MACD Histogram</h4>
              <ResponsiveContainer width="100%" height={120}>
                <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <Bar dataKey="macd">
                    {chartData.map((entry, index) => (
                      <rect
                        key={index}
                        fill={entry.macd && entry.macd >= 0 ? '#00d4aa' : '#ff4757'}
                        opacity={0.7}
                      />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
