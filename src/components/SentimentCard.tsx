'use client';

import { useEffect, useState } from 'react';

interface FearGreedData {
  value: number;
  classification: string;
  timestamp: number;
  previousClose: number;
}

interface NewsSentiment {
  score: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  headlineCount: number;
  topHeadlines: { title: string; source: string }[];
}

interface SentimentResponse {
  fearGreed: FearGreedData | null;
  news: NewsSentiment | null;
  combined: {
    score: number;
    sentiment: 'bullish' | 'bearish' | 'neutral';
  };
  lastUpdate: number;
}

interface SentimentCardProps {
  compact?: boolean;
}

export function SentimentCard({ compact = false }: SentimentCardProps) {
  const [data, setData] = useState<SentimentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const fetchSentiment = async () => {
      try {
        const res = await fetch('/api/sentiment');
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError('Unable to load');
      } finally {
        setLoading(false);
      }
    };

    fetchSentiment();
  }, []);

  const getSentimentColor = (value: number) => {
    if (value <= 25) return '#ff4757';
    if (value <= 45) return '#ff6b7a';
    if (value <= 55) return '#f7931a';
    if (value <= 75) return '#00d4aa';
    return '#00e6bb';
  };

  const getSentimentGradient = (value: number) => {
    if (value <= 25) return 'linear-gradient(135deg, #ff4757 0%, #ff6b7a 100%)';
    if (value <= 45) return 'linear-gradient(135deg, #ff6b7a 0%, #ff8a8f 100%)';
    if (value <= 55) return 'linear-gradient(135deg, #f7931a 0%, #ffab33 100%)';
    if (value <= 75) return 'linear-gradient(135deg, #00d4aa 0%, #00e6bb 100%)';
    return 'linear-gradient(135deg, #00e6bb 0%, #33ffd6 100%)';
  };

  if (loading) {
    return (
      <div className="sentiment-card">
        <div className="sentiment-header">
          <h3>Market Sentiment</h3>
        </div>
        <div className="sentiment-loading">
          <div className="sentiment-skeleton-gauge"></div>
          <div className="sentiment-skeleton-text"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="sentiment-card">
        <div className="sentiment-header">
          <h3>Market Sentiment</h3>
        </div>
        <div className="sentiment-error">
          <span>{error || 'N/A'}</span>
        </div>
      </div>
    );
  }

  const { fearGreed, news, combined } = data;
  const sentimentColor = getSentimentColor(combined.score);
  const gradient = getSentimentGradient(combined.score);

  const fgChange = fearGreed ? fearGreed.value - fearGreed.previousClose : 0;
  const fgChangePercent = fearGreed?.previousClose ? ((fgChange / fearGreed.previousClose) * 100).toFixed(1) : '0';

  const newsSentiment = news?.sentiment || 'neutral';

  if (compact) {
    return (
      <div 
        className="sentiment-compact"
        style={{ borderColor: sentimentColor }}
      >
        <span className="sentiment-compact-label">Sentiment</span>
        <span 
          className="sentiment-compact-value" 
          style={{ color: sentimentColor }}
        >
          {combined.score}
        </span>
        <span 
          className="sentiment-compact-class" 
          style={{ color: sentimentColor }}
        >
          {combined.sentiment.charAt(0).toUpperCase() + combined.sentiment.slice(1)}
        </span>
      </div>
    );
  }

  return (
    <div className="sentiment-card">
      <div className="sentiment-header">
        <h3>Market Sentiment</h3>
        {news && news.topHeadlines.length > 0 && (
          <button 
            type="button"
            className="sentiment-details-toggle"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
        )}
      </div>

      <div className="sentiment-gauge-container">
        <svg viewBox="0 0 200 120" className="sentiment-gauge">
          <defs>
            <linearGradient id="gaugeGradientV2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff4757" />
              <stop offset="25%" stopColor="#ff6b7a" />
              <stop offset="50%" stopColor="#f7931a" />
              <stop offset="75%" stopColor="#00d4aa" />
              <stop offset="100%" stopColor="#00e6bb" />
            </linearGradient>
          </defs>
          
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#2a2a3a"
            strokeWidth="16"
            strokeLinecap="round"
          />
          
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gaugeGradientV2)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={`${(combined.score / 100) * 251.2} 251.2`}
          />
          
          <circle
            cx={100 + 80 * Math.cos(Math.PI * (1 - combined.score / 100))}
            cy={100 - 80 * Math.sin(Math.PI * (1 - combined.score / 100))}
            r="8"
            fill={sentimentColor}
            className="sentiment-gauge-dot"
          />
        </svg>

        <div className="sentiment-value-display">
          <span className="sentiment-value" style={{ color: sentimentColor }}>
            {combined.score}
          </span>
          <span className="sentiment-max">/100</span>
        </div>
      </div>

      <div className="sentiment-classification" style={{ color: sentimentColor }}>
        {combined.sentiment === 'bullish' ? 'Bullish Market' : combined.sentiment === 'bearish' ? 'Bearish Market' : 'Neutral Market'}
      </div>

      <div className="sentiment-sources">
        <div className="sentiment-source">
          <span className="source-label">Fear & Greed</span>
          <span className="source-value" style={{ color: fearGreed ? getSentimentColor(fearGreed.value) : '#8b8b9a' }}>
            {fearGreed ? `${fearGreed.value} (${fgChange >= 0 ? '+' : ''}${fgChange})` : 'N/A'}
          </span>
        </div>
        <div className="sentiment-source">
          <span className="source-label">News Sentiment</span>
          <span className={`source-value ${newsSentiment}`}>
            {news ? newsSentiment.charAt(0).toUpperCase() + newsSentiment.slice(1) : 'N/A'}
          </span>
        </div>
      </div>

      {showDetails && news && news.topHeadlines.length > 0 && (
        <div className="sentiment-headlines">
          <h4>Latest Headlines</h4>
          {news.topHeadlines.map((headline, i) => (
            <div key={i} className="headline-item">
              <span className="headline-title">{headline.title}</span>
              <span className="headline-source">{headline.source}</span>
            </div>
          ))}
        </div>
      )}

      <div className="sentiment-scale">
        <span className="scale-point fear">0</span>
        <span className="scale-point neutral">50</span>
        <span className="scale-point greed">100</span>
      </div>
    </div>
  );
}
