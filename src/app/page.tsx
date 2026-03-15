'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { MarketStats } from '@/components/MarketStats';
import { IndicatorCard } from '@/components/IndicatorCard';
import { PredictionChart } from '@/components/PredictionChart';
import { TechnicalChart } from '@/components/TechnicalChart';
import { TimeframeToggle } from '@/components/TimeframeToggle';
import { SentimentCard } from '@/components/SentimentCard';
import { BacktestChart } from '@/components/BacktestChart';
import { PortfolioCard } from '@/components/PortfolioCard';
import { ModelSettingsCard, defaultModelSettings, ModelSettings } from '@/components/ModelSettingsCard';
import { ExportButton } from '@/components/ExportButton';
import { OrderBookPanel } from '@/components/OrderBookPanel';
import { MarketRegimePanel } from '@/components/MarketRegimePanel';
import { useMultiTimeframe } from '@/lib/TimeframeContext';

export default function Home() {
  const [predicting, setPredicting] = useState(false);
  const [showVisualization, setShowVisualization] = useState(true);
  const [modelSettings, setModelSettings] = useState<ModelSettings>(defaultModelSettings);
  const { activeTimeframe, timeframeData, loading: tfLoading, error: tfError } = useMultiTimeframe();

  const currentData = timeframeData[activeTimeframe];
  const indicators = currentData?.indicators ?? null;

  return (
    <main className="main">
      <Header />
      
      <div className="container">
        <div className="timeframe-header">
          <h2 className="timeframe-label">Timeframe Analysis</h2>
          <div className="timeframe-controls">
            <TimeframeToggle />
            <ExportButton 
              chartId="main-chart"
              filename="btc-report"
              title="BTC Report - Market Analysis"
              summaryData={{
                'Timeframe': activeTimeframe,
                'Generated': new Date().toLocaleString()
              }}
            />
          </div>
        </div>

        {tfError && (
          <div className="error-banner">
            {tfError}
          </div>
        )}

        <div className="grid" id="main-chart">
          <div className="main-content">
            <div className="section market-section">
              <MarketStats 
                lastCandle={currentData?.lastCandle}
                loading={tfLoading}
              />
            </div>

            <PortfolioCard />

            <div className="section prediction-section">
              <PredictionChart 
                onPredict={() => setPredicting(true)}
                onPredictComplete={() => setPredicting(false)}
                isLoading={predicting}
                chartData={currentData?.chartData}
                modelSettings={modelSettings}
              />
              
              <ModelSettingsCard 
                settings={modelSettings}
                onSettingsChange={setModelSettings}
                isTraining={predicting}
              />
            </div>

            <div className="section backtest-section">
              <BacktestChart />
            </div>
          </div>

          <div className="sidebar">
            <div className="indicators-section">
              <h2 className="section-title">Technical Indicators</h2>
              
              {tfLoading ? (
                <div className="loading-indicators">
                  <div className="skeleton-card"></div>
                  <div className="skeleton-card"></div>
                  <div className="skeleton-card"></div>
                  <div className="skeleton-card"></div>
                </div>
              ) : (
                <>
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
                      subtitle="Price variance"
                    />
                    
                    <IndicatorCard 
                      title="Trend"
                      value={indicators?.trend ?? null}
                      type="trend"
                      trend={indicators?.trend ?? 'neutral'}
                      subtitle={indicators?.trend === 'bullish' ? 'Bullish trend' : indicators?.trend === 'bearish' ? 'Bearish trend' : 'Sideways'}
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
                </>
              )}
            </div>

            <div className="sentiment-section">
              <SentimentCard />
            </div>

            <div className="orderbook-section">
              <OrderBookPanel />
            </div>

            <div className="regime-section">
              <MarketRegimePanel />
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
                <TechnicalChart chartData={currentData?.chartData} />
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>BTC Report - AI-Powered Bitcoin Prediction Tool</p>
        <p className="disclaimer">
          Predictions are for educational purposes only. Not financial advice.
        </p>
      </footer>
    </main>
  );
}
