import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function getFearGreed() {
  try {
    const response = await fetch('https://api.alternative.me/fng/');
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.data || data.data.length === 0) return null;
    
    const latest = data.data[0];
    const value = parseInt(latest.value);
    
    return {
      value,
      classification: latest.value_classification,
      timestamp: parseInt(latest.timestamp) * 1000,
      previousClose: parseInt(data.data[1]?.value || '50')
    };
  } catch (error) {
    console.error('Error fetching Fear & Greed:', error);
    return null;
  }
}

async function getNewsSentiment() {
  try {
    const response = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN', {
      next: { revalidate: 300 }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const headlines = data.Data?.slice(0, 20) || [];
    
    const positiveWords = ['bullish', 'rise', 'surge', 'gain', 'up', 'growth', 'rally', 'high', 'positive', 'adoption', 'breakout', 'boom', 'optimistic', 'soar', 'jump'];
    const negativeWords = ['bearish', 'fall', 'drop', 'crash', 'down', 'loss', 'decline', 'low', 'negative', 'ban', 'hack', 'scam', 'fear', 'sell', 'dump', 'plunge'];
    
    let totalScore = 0;
    
    for (const headline of headlines) {
      const title = headline.title.toLowerCase();
      for (const word of positiveWords) {
        if (title.includes(word)) totalScore += 1;
      }
      for (const word of negativeWords) {
        if (title.includes(word)) totalScore -= 1;
      }
    }
    
    const averageScore = totalScore / headlines.length;
    const sentiment = averageScore > 0.3 ? 'bullish' : averageScore < -0.3 ? 'bearish' : 'neutral';
    
    return {
      score: averageScore,
      sentiment,
      headlineCount: headlines.length,
      topHeadlines: headlines.slice(0, 5).map((h: { title: string; source_info: { name: string } }) => ({
        title: h.title,
        source: h.source_info?.name || 'Unknown'
      }))
    };
  } catch (error) {
    console.error('Error fetching news sentiment:', error);
    return null;
  }
}

export async function GET() {
  try {
    const [fearGreed, newsSentiment] = await Promise.all([
      getFearGreed(),
      getNewsSentiment()
    ]);
    
    const combinedSentiment = calculateCombinedSentiment(fearGreed, newsSentiment);
    
    return NextResponse.json({
      fearGreed,
      news: newsSentiment,
      combined: combinedSentiment,
      lastUpdate: Date.now()
    });
  } catch (error) {
    console.error('Error getting sentiment data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sentiment data' },
      { status: 500 }
    );
  }
}

function calculateCombinedSentiment(
  fearGreed: { value: number } | null,
  news: { score: number; sentiment: string } | null
) {
  let score = 50;
  let sources = 0;
  
  if (fearGreed) {
    score = fearGreed.value;
    sources++;
  }
  
  if (news) {
    const newsScore = ((news.score + 2) / 4) * 100;
    score = sources > 0 ? (score + newsScore) / 2 : newsScore;
    sources++;
  }
  
  if (sources === 0) {
    return { score: 50, sentiment: 'neutral' as const };
  }
  
  const sentiment = score > 60 ? 'bullish' : score < 40 ? 'bearish' : 'neutral';
  
  return {
    score: Math.round(score),
    sentiment
  };
}
