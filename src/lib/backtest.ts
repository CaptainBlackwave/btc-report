import * as tf from '@tensorflow/tfjs';
import { Candle } from './binance';

export interface BacktestResult {
  date: string;
  actualPrice: number;
  predictedPrice: number;
}

export interface BacktestSummary {
  results: BacktestResult[];
  mae: number;
  mape: number;
  accuracy: number;
  totalPredictions: number;
  correctDirection: number;
  totalDirection: number;
  directionAccuracy: number;
}

const SEQUENCE_LENGTH = 24;
const TRAIN_RATIO = 0.8;

function normalizeData(data: number[]): { min: number; max: number; normalized: number[] } {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  const normalized = data.map(v => (v - min) / range);
  return { min, max, normalized };
}

function createSequences(data: number[], seqLength: number): { X: number[][]; y: number[] } {
  const X: number[][] = [];
  const y: number[] = [];
  
  for (let i = seqLength; i < data.length; i++) {
    X.push(data.slice(i - seqLength, i));
    y.push(data[i]);
  }
  
  return { X, y };
}

function calculateMAE(actual: number[], predicted: number[]): number {
  const sum = actual.reduce((acc, val, i) => acc + Math.abs(val - predicted[i]), 0);
  return sum / actual.length;
}

function calculateMAPE(actual: number[], predicted: number[]): number {
  const sum = actual.reduce((acc, val, i) => acc + Math.abs((val - predicted[i]) / val) * 100, 0);
  return sum / actual.length;
}

async function trainLSTMModel(X: number[][], y: number[]): Promise<tf.LayersModel> {
  const model = tf.sequential();
  
  model.add(tf.layers.lstm({
    units: 32,
    returnSequences: true,
    inputShape: [X[0].length, 1]
  }));
  
  model.add(tf.layers.dropout({ rate: 0.2 }));
  
  model.add(tf.layers.lstm({
    units: 16,
    returnSequences: false
  }));
  
  model.add(tf.layers.dropout({ rate: 0.2 }));
  
  model.add(tf.layers.dense({ units: 1 }));
  
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError'
  });
  
  const xs = tf.tensor3d(X.map(x => x.map(v => [v])));
  const ys = tf.tensor2d(y.map(v => [v]));
  
  await model.fit(xs, ys, {
    epochs: 5,
    batchSize: 32,
    verbose: 0,
    validationSplit: 0.1
  });
  
  xs.dispose();
  ys.dispose();
  
  return model;
}

async function trainRandomForest(X: number[][], y: number[]): Promise<{ weights: number[][]; bias: number }> {
  const numTrees = 50;
  const maxDepth = 8;
  
  const trees: { splitPoints: number[]; thresholds: number[]; leafValues: number[] }[] = [];
  
  for (let t = 0; t < numTrees; t++) {
    const indices = X.map((_, i) => i).sort(() => Math.random() - 0.5).slice(0, Math.floor(X.length * 0.8));
    const XSample = indices.map(i => X[i]);
    const ySample = indices.map(i => y[i]);
    
    const featureImportance = X[0].map((_, f) => f).sort(() => Math.random() - 0.5).slice(0, Math.ceil(X[0].length * 0.7));
    
    const leafValues: number[] = [];
    const splitPoints: number[] = [];
    const thresholds: number[] = [];
    
    function buildTree(X: number[][], y: number[], depth: number): number {
      if (depth >= maxDepth || X.length < 5) {
        const avg = y.reduce((a, b) => a + b, 0) / y.length;
        leafValues.push(avg);
        return leafValues.length - 1;
      }
      
      let bestFeature = featureImportance[Math.floor(Math.random() * featureImportance.length)];
      let bestThreshold = X[0][0];
      let bestVariance = Infinity;
      
      for (const feature of featureImportance) {
        const values = X.map(row => row[feature]);
        const threshold = values[Math.floor(Math.random() * values.length)];
        
        const left = X.map((row, i) => row[feature] <= threshold ? y[i] : null).filter(v => v !== null);
        const right = X.map((row, i) => row[feature] > threshold ? y[i] : null).filter(v => v !== null);
        
        if (left.length === 0 || right.length === 0) continue;
        
        const leftVar = left.reduce((a, b) => a + Math.pow(b - left.reduce((c, d) => c + d, 0) / left.length, 2), 0) / left.length;
        const rightVar = right.reduce((a, b) => a + Math.pow(b - right.reduce((c, d) => c + d, 0) / right.length, 2), 0) / right.length;
        
        const variance = leftVar + rightVar;
        
        if (variance < bestVariance) {
          bestVariance = variance;
          bestFeature = feature;
          bestThreshold = threshold;
        }
      }
      
      splitPoints.push(bestFeature);
      thresholds.push(bestThreshold);
      
      const leftIndices = X.map((row, i) => row[bestFeature] <= bestThreshold ? i : -1).filter(i => i >= 0);
      const rightIndices = X.map((row, i) => row[bestFeature] > bestThreshold ? i : -1).filter(i => i >= 0);
      
      const leftTree = buildTree(leftIndices.map(i => X[i]), leftIndices.map(i => y[i]), depth + 1);
      const rightTree = buildTree(rightIndices.map(i => X[i]), rightIndices.map(i => y[i]), depth + 1);
      
      return -leftTree - 1 - rightTree - 1;
    }
    
    buildTree(XSample, ySample, 0);
    
    trees.push({ splitPoints, thresholds, leafValues });
  }
  
  return { weights: trees.map(t => t.splitPoints.map((f, i) => f * 1000 + t.thresholds[i])), bias: 0 };
}

function predictWithModel(model: tf.LayersModel | { weights: number[][]; bias: number }, X: number[][], isLSTM: boolean): number[] {
  if (isLSTM && 'predict' in model) {
    const xs = tf.tensor3d(X.map(x => x.map(v => [v])));
    const preds = model.predict(xs) as tf.Tensor;
    const result = Array.from(preds.dataSync());
    xs.dispose();
    preds.dispose();
    return result;
  } else {
    return X.map(x => {
      let sum = 0;
      const rfModel = model as { weights: number[][]; bias: number };
      const flatWeights = rfModel.weights.flat();
      for (let i = 0; i < x.length; i++) {
        sum += x[i] * (flatWeights[i] || 1);
      }
      return sum + rfModel.bias;
    });
  }
}

export async function runBacktest(
  candles: Candle[],
  options: { useLSTM?: boolean; lookback?: number } = {}
): Promise<BacktestSummary> {
  const { useLSTM = false, lookback = SEQUENCE_LENGTH } = options;
  
  if (candles.length < lookback + 50) {
    throw new Error('Not enough data for backtesting');
  }
  
  const closes = candles.map(c => c.close);
  const times = candles.map(c => c.time);
  
  const { min, max, normalized } = normalizeData(closes);
  const range = max - min;
  
  const splitIndex = Math.floor(closes.length * TRAIN_RATIO);
  const trainData = normalized.slice(0, splitIndex);
  const testDataNormalized = normalized.slice(splitIndex - lookback);
  const testDataActual = closes.slice(splitIndex);
  const testTimes = times.slice(splitIndex);
  
  const { X: XTrain, y: yTrain } = createSequences(trainData, lookback);
  
  let model: tf.LayersModel | { weights: number[][]; bias: number };
  
  try {
    if (useLSTM) {
      model = await trainLSTMModel(XTrain, yTrain);
    } else {
      model = await trainRandomForest(XTrain, yTrain);
    }
  } catch (error) {
    console.error('Model training failed:', error);
    throw new Error('Failed to train model for backtesting');
  }
  
  const predictions: number[] = [];
  
  for (let i = 0; i < testDataNormalized.length - lookback; i++) {
    const window = testDataNormalized.slice(i, i + lookback);
    const input = window.map(v => [v]);
    
    if (useLSTM && 'predict' in model) {
      const xs = tf.tensor3d([input]);
      const pred = model.predict(xs) as tf.Tensor;
      const predValue = Array.from(pred.dataSync())[0];
      predictions.push(predValue);
      xs.dispose();
      pred.dispose();
    } else {
      const rfModel = model as { weights: number[][]; bias: number };
      const flatWeights = rfModel.weights.flat();
      let sum = 0;
      for (let j = 0; j < window.length; j++) {
        sum += window[j] * (flatWeights[j] || 1);
      }
      predictions.push((sum + rfModel.bias) * range + min);
    }
  }
  
  if (useLSTM && 'predict' in model) {
    (model as tf.LayersModel).dispose();
  }
  
  const predictedPrices = predictions.map(p => p * range + min);
  
  const actualPrices = testDataActual.slice(1);
  const predictedPricesAligned = predictedPrices.slice(0, actualPrices.length);
  
  const mae = calculateMAE(actualPrices, predictedPricesAligned);
  const mape = calculateMAPE(actualPrices, predictedPricesAligned);
  
  let correctDirection = 0;
  for (let i = 1; i < actualPrices.length; i++) {
    const actualDirection = actualPrices[i] > actualPrices[i - 1];
    const predictedDirection = predictedPricesAligned[i] > predictedPricesAligned[i - 1];
    if (actualDirection === predictedDirection) {
      correctDirection++;
    }
  }
  
  const directionAccuracy = (correctDirection / (actualPrices.length - 1)) * 100;
  
  const results: BacktestResult[] = testTimes.slice(1, actualPrices.length + 1).map((time, i) => ({
    date: new Date(time).toLocaleDateString(),
    actualPrice: actualPrices[i],
    predictedPrice: predictedPricesAligned[i]
  }));
  
  return {
    results,
    mae,
    mape,
    accuracy: Math.max(0, 100 - mape),
    totalPredictions: actualPrices.length,
    correctDirection,
    totalDirection: actualPrices.length - 1,
    directionAccuracy
  };
}
