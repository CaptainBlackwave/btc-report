'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { MarketStats } from '@/components/MarketStats';
import { IndicatorCard } from '@/components/IndicatorCard';
import { PredictionChart } from '@/components/PredictionChart';
import { TechnicalChart } from '@/components/TechnicalChart';

interface Indicators {
  rsi: number | null;
  macd: { MACD: number; signal: number; histogram: number } | null;
  bollingerBands: { upper: number; middle: number; lower: number } | null;
  sma7: number | null;
  sma25: number | null;
  sma99: number | null;
  volatility: number;
  trend: 'bullish' | 'bearish' | 'neutral';
}

export default function Home() {
  const [indicators, setIndicators] = useState<Indicators | null>(null);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [showVisualization, setShowVisualization] = useState(true);

  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        const res = await fetch('/api/indicators');
        if (res.ok) {
          const data = await res.json();
          setIndicators(data.indicators);
        }
      } catch (err) {
        console.error('Failed to fetch indicators:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchIndicators();
  }, []);

  return (
    <main className="main">
      <Header />
      
      <div className="container">
        <div className="grid">
          <div className="main-content">
            <div className="section market-section">
              <MarketStats />
            </div>

            <div className="section prediction-section">
              <PredictionChart 
                onPredict={() => setPredicting(true)}
                isLoading={predicting}
              />
            </div>
          </div>

          <div className="sidebar">
            <div className="indicators-section">
              <h2 className="section-title">Technical Indicators</h2>
              
              <div className="indicators-grid">
                <IndicatorCard 
                  title="RSI (14)"
                  value={indicators?.rsi ?? null}
                  type="rsi"
                  subtitle={indicators?.rsi ? (indicators.rsi >= 70 ? 'Overbought' : indicators.rsi <= 30 ? 'Oversold' : 'Neutral') : undefined}
                />
                
                <IndicatorCard 
                  title="MACD"
                  value={indicators?.macd?.histogram ?? null}
                  type="macd"
                  subtitle={indicators?.macd ? `Signal: ${indicators.macd.signal.toFixed(2)}` : undefined}
                />
                
                <IndicatorCard 
                  title="Volatility"
                  value={indicators?.volatility ?? null}
                  type="volatility"
                  subtitle="Hourly price variance"
                />
                
                <IndicatorCard 
                  title="Trend"
                  value={indicators?.trend ?? null}
                  type="trend"
                  trend={indicators?.trend ?? 'neutral'}
                  subtitle={indicators?.trend === 'bullish' ? 'Short-term bullish' : indicators?.trend === 'bearish' ? 'Short-term bearish' : 'Sideways movement'}
                />
              </div>

              {indicators?.bollingerBands && (
                <div className="bb-info">
                  <h4>Bollinger Bands</h4>
                  <div className="bb-values">
                    <span className="bb-upper">Upper: ${indicators.bollingerBands.upper.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <span className="bb-middle">Middle: ${indicators.bollingerBands.middle.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <span className="bb-lower">Lower: ${indicators.bollingerBands.lower.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              )}

              {indicators?.sma7 && indicators?.sma25 && indicators?.sma99 && (
                <div className="sma-info">
                  <h4>Moving Averages</h4>
                  <div className="sma-values">
                    <span className="sma-7">SMA 7: ${indicators.sma7.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <span className="sma-25">SMA 25: ${indicators.sma25.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <span className="sma-99">SMA 99: ${indicators.sma99.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="visualization-toggle">
              <button 
                className={`viz-toggle-btn ${showVisualization ? 'active' : ''}`}
                onClick={() => setShowVisualization(!showVisualization)}
              >
                {showVisualization ? 'Hide Charts' : 'Show Charts'}
              </button>
            </div>

            {showVisualization && (
              <div className="technical-section">
                <TechnicalChart />
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>Dump BTC - AI-Powered Bitcoin Prediction Tool</p>
        <p className="disclaimer">
          Predictions are for educational purposes only. Not financial advice.
        </p>
      </footer>
    </main>
  );
}
