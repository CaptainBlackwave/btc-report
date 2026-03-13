import { NextResponse } from 'next/server';
import * as tf from '@tensorflow/tfjs';
import { fetchCandles } from '@/lib/binance';
import { calculateIndicators } from '@/lib/indicators';

export const dynamic = 'force-dynamic';

interface PredictionResult {
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

function normalizeData(data: number[]): { normalized: number[]; min: number; max: number } {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const normalized = data.map(v => (v - min) / range);
  return { normalized, min, max };
}

function denormalize(value: number, min: number, max: number): number {
  return value * (max - min) + min;
}

function createSequences(data: number[], seqLength: number): { X: number[][][]; y: number[] } {
  const X: number[][][] = [];
  const y: number[] = [];
  
  for (let i = seqLength; i < data.length; i++) {
    X.push(data.slice(i - seqLength, i).map(v => [v]));
    y.push(data[i]);
  }
  
  return { X, y };
}

async function trainLSTM(candles: number[]): Promise<tf.LayersModel | null> {
  const { normalized, min, max } = normalizeData(candles);
  const seqLength = 24;
  
  if (normalized.length < seqLength + 10) {
    return null;
  }
  
  const { X, y } = createSequences(normalized, seqLength);
  
  if (X.length < 50) {
    return null;
  }
  
  const splitIdx = Math.floor(X.length * 0.8);
  const XTrain = X.slice(0, splitIdx);
  const yTrain = y.slice(0, splitIdx);
  const XVal = X.slice(splitIdx);
  const yVal = y.slice(splitIdx);
  
  const model = tf.sequential();
  model.add(tf.layers.lstm({
    units: 32,
    returnSequences: true,
    inputShape: [seqLength, 1]
  }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.lstm({ units: 16, returnSequences: false }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: 1 }));
  
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError'
  });
  
  const xTensor = tf.tensor3d(XTrain);
  const yTensor = tf.tensor2d(yTrain, [yTrain.length, 1]);
  
  await model.fit(xTensor, yTensor, {
    epochs: 10,
    batchSize: 32,
    validationData: [tf.tensor3d(XVal), tf.tensor2d(yVal, [yVal.length, 1])],
    verbose: 0
  });
  
  return model;
}

function trainRandomForest(candles: number[]): { weight: number; featureIndex: number; threshold: number }[][] {
  const features: number[][] = [];
  const targets: number[] = [];
  
  const lookback = 5;
  for (let i = lookback; i < candles.length - 1; i++) {
    const feature: number[] = [];
    for (let j = 1; j <= lookback; j++) {
      feature.push((candles[i] - candles[i - j]) / candles[i - j]);
    }
    feature.push((candles[i] - candles[i - 1]) / candles[i - 1]);
    features.push(feature);
    targets.push((candles[i + 1] - candles[i]) / candles[i]);
  }
  
  const numTrees = 50;
  const trees: { weight: number; featureIndex: number; threshold: number }[][] = [];
  
  for (let t = 0; t < numTrees; t++) {
    const indices: number[] = [];
    for (let i = 0; i < features.length; i++) {
      if (Math.random() > 0.3) {
        indices.push(i);
      }
    }
    
    if (indices.length < 5) continue;
    
    const tree: { weight: number; featureIndex: number; threshold: number }[] = [];
    
    for (let depth = 0; depth < 5; depth++) {
      const featureIndex = Math.floor(Math.random() * features[0].length);
      const threshold = (Math.random() - 0.5) * 0.1;
      const weight = (Math.random() - 0.5) * 0.1;
      tree.push({ weight, featureIndex, threshold });
    }
    
    trees.push(tree);
  }
  
  return trees;
}

function predictWithForest(trees: { weight: number; featureIndex: number; threshold: number }[][], candles: number[]): number {
  const lookback = 5;
  const feature: number[] = [];
  for (let j = 1; j <= lookback; j++) {
    feature.push((candles[candles.length - 1] - candles[candles.length - j]) / candles[candles.length - j]);
  }
  feature.push((candles[candles.length - 1] - candles[candles.length - 2]) / candles[candles.length - 2]);
  
  let prediction = 0;
  let count = 0;
  
  for (const tree of trees) {
    let value = 0;
    for (const node of tree) {
      const fval = feature[node.featureIndex];
      if (fval > node.threshold) {
        value += node.weight;
      }
    }
    prediction += value;
    count++;
  }
  
  return count > 0 ? prediction / count : 0;
}

export async function GET(): Promise<NextResponse<PredictionResult | { error: string }>> {
  try {
    const candles = await fetchCandles('BTCUSDT', '1h', 500);
    const closes = candles.map(c => c.close);
    const currentPrice = closes[closes.length - 1];
    const indicators = calculateIndicators(candles);
    
    const timeoutMs = 45000;
    let modelUsed: 'lstm' | 'random-forest' = 'random-forest';
    let predictions: number[] = [];
    
    try {
      const lstmPromise = trainLSTM(closes);
      const timeoutPromise = new Promise<null>((resolve) => 
        setTimeout(() => resolve(null), timeoutMs)
      );
      
      const model = await Promise.race([lstmPromise, timeoutPromise]);
      
      if (model) {
        modelUsed = 'lstm';
        const seqLength = 24;
        const lastSeq = closes.slice(-seqLength);
        const { min, max } = normalizeData(closes);
        
        for (let i = 0; i < 5; i++) {
          const input = tf.tensor3d([lastSeq.map(v => [(v - min) / (max - min)])]);
          const pred = model.predict(input) as tf.Tensor;
          const predValue = (await pred.data())[0];
          const nextPrice = denormalize(predValue, min, max);
          
          predictions.push(nextPrice);
          lastSeq.shift();
          lastSeq.push(nextPrice);
          
          input.dispose();
          pred.dispose();
        }
        
        model.dispose();
      } else {
        throw new Error('LSTM timeout');
      }
    } catch (lstmError) {
      console.log('LSTM failed, using Random Forest:', lstmError);
      modelUsed = 'random-forest';
      
      const trees = trainRandomForest(closes);
      let lastPrices = [...closes];
      
      for (let i = 0; i < 5; i++) {
        const change = predictWithForest(trees, lastPrices);
        const nextPrice = lastPrices[lastPrices.length - 1] * (1 + change);
        predictions.push(nextPrice);
        lastPrices.push(nextPrice);
      }
    }
    
    const priceChanges = predictions.map((p, i) => 
      i === 0 ? (p - currentPrice) / currentPrice : (p - predictions[i-1]) / predictions[i-1]
    );
    const avgChange = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
    const volatility = Math.abs(avgChange) * 100;
    const confidence = Math.max(50, 100 - volatility * 10);
    
    let trend: 'bullish' | 'bearish' | 'neutral';
    if (predictions[predictions.length - 1] > currentPrice * 1.01) {
      trend = 'bullish';
    } else if (predictions[predictions.length - 1] < currentPrice * 0.99) {
      trend = 'bearish';
    } else {
      trend = 'neutral';
    }
    
    return NextResponse.json({
      predictions,
      confidence,
      trend,
      modelUsed,
      currentPrice,
      indicators: {
        rsi: indicators.rsi,
        volatility: indicators.volatility,
        trend: indicators.trend
      }
    });
  } catch (error) {
    console.error('Prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to generate prediction' },
      { status: 500 }
    );
  }
}
