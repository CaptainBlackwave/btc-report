import { NextResponse } from 'next/server';
import Sentiment from 'sentiment';

export const dynamic = 'force-dynamic';

interface NewsItem {
  title: string;
  url: string;
  published_at: string;
  source: { name: string };
}

interface SentimentResult {
  score: number;
  comparative: number;
  positive: string[];
  negative: string[];
}

interface AnalysisResult {
  overallScore: number;
  overallComparative: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  positiveTopics: string[];
  negativeTopics: string[];
  headlineCount: number;
  averageScore: number;
  headlines: {
    title: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    source: string;
  }[];
}

async function fetchCryptoNews(): Promise<NewsItem[]> {
  try {
    const newsApiKey = process.env.CRYPTOPANIC_API_KEY;
    
    if (newsApiKey) {
      const response = await fetch(
        `https://cryptopanic.com/api/v1/posts/?auth_token=${newsApiKey}&filter=hot&kind=news`,
        { next: { revalidate: 300 } }
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.results?.slice(0, 20) || [];
      }
    }
  } catch (error) {
    console.log('CryptoPanic API not available, using fallback');
  }

  try {
    const response = await fetch(
      'https://min-api.cryptocompare.com/data/v2/news/?lang=EN',
      { next: { revalidate: 300 } }
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.Data?.slice(0, 20).map((item: { title: string; url: string; published_on: number; source_info: { name: string } }) => ({
        title: item.title,
        url: item.url,
        published_at: new Date(item.published_on * 1000).toISOString(),
        source: { name: item.source_info?.name || 'Unknown' }
      })) || [];
    }
  } catch (error) {
    console.error('Error fetching crypto news:', error);
  }

  return [];
}

function analyzeHeadline(headline: string, sentiment: Sentiment): SentimentResult {
  const result = sentiment.analyze(headline);
  return {
    score: result.score,
    comparative: result.comparative,
    positive: result.positive,
    negative: result.negative
  };
}

function extractCryptoTopics(headline: string): string[] {
  const topics: string[] = [];
  const lowerHeadline = headline.toLowerCase();
  
  const cryptoTerms = [
    'bitcoin', 'btc', 'ethereum', 'eth', 'satoshi', 'blockchain',
    'miner', 'mining', 'halving', 'wallet', 'exchange', 'binance',
    'coinbase', 'regulatory', 'regulation', 'sec', 'etf', 'spot etf',
    'institutional', 'whale', 'defi', 'nft', 'layer2', 'l2'
  ];
  
  for (const term of cryptoTerms) {
    if (lowerHeadline.includes(term)) {
      topics.push(term);
    }
  }
  
  return topics;
}

export async function GET() {
  try {
    const headlines = await fetchCryptoNews();
    
    if (headlines.length === 0) {
      return NextResponse.json({
        error: 'No news available',
        fallback: true
      });
    }
    
    const sentiment = new Sentiment();
    const analyzedHeadlines: AnalysisResult['headlines'] = [];
    let totalScore = 0;
    let totalComparative = 0;
    const allPositive: string[] = [];
    const allNegative: string[] = [];
    
    for (const item of headlines) {
      const analysis = analyzeHeadline(item.title, sentiment);
      const topics = extractCryptoTopics(item.title);
      
      allPositive.push(...analysis.positive);
      allNegative.push(...analysis.negative);
      totalScore += analysis.score;
      totalComparative += analysis.comparative;
      
      analyzedHeadlines.push({
        title: item.title,
        sentiment: analysis.score > 0 ? 'positive' : analysis.score < 0 ? 'negative' : 'neutral',
        score: analysis.score,
        source: item.source?.name || 'Unknown'
      });
    }
    
    const averageScore = totalScore / headlines.length;
    const averageComparative = totalComparative / headlines.length;
    
    const sentimentLabel = averageComparative > 0.05 ? 'bullish' : averageComparative < -0.05 ? 'bearish' : 'neutral';
    
    const uniquePositive = [...new Set(allPositive)].slice(0, 10);
    const uniqueNegative = [...new Set(allNegative)].slice(0, 10);
    
    return NextResponse.json({
      overallScore: averageScore,
      overallComparative: averageComparative,
      sentiment: sentimentLabel,
      positiveTopics: uniquePositive,
      negativeTopics: uniqueNegative,
      headlineCount: headlines.length,
      averageScore,
      headlines: analyzedHeadlines.slice(0, 10)
    });
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return NextResponse.json(
      { error: 'Failed to analyze sentiment' },
      { status: 500 }
    );
  }
}
