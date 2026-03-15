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
  if (range === 0) {
    return { min, max, normalized: data.map(() => 0.5) };
  }
  const normalized = data.map(v => (v - min) / range);
  return { min, max, normalized };
}

function denormalize(value: number, min: number, max: number): number {
  return value * (max - min) + min;
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

function trainLinearModel(X: number[][], y: number[]): { weights: number[]; bias: number } {
  const n = X.length;
  const features = X[0].length;
  
  const weights: number[] = new Array(features).fill(0);
  let bias = y.reduce((a, b) => a + b, 0) / n;
  
  const learningRate = 0.001;
  const epochs = 100;
  
  for (let epoch = 0; epoch < epochs; epoch++) {
    const gradients = new Array(features).fill(0);
    let biasGrad = 0;
    
    for (let i = 0; i < n; i++) {
      let prediction = bias;
      for (let j = 0; j < features; j++) {
        prediction += X[i][j] * weights[j];
      }
      
      const error = prediction - y[i];
      
      biasGrad += error;
      for (let j = 0; j < features; j++) {
        gradients[j] += error * X[i][j];
      }
    }
    
    biasGrad /= n;
    for (let j = 0; j < features; j++) {
      gradients[j] /= n;
    }
    
    bias -= learningRate * biasGrad;
    for (let j = 0; j < features; j++) {
      weights[j] -= learningRate * gradients[j];
    }
  }
  
  return { weights, bias };
}

function predictLinear(model: { weights: number[]; bias: number }, X: number[][]): number[] {
  return X.map(x => {
    let prediction = model.bias;
    for (let i = 0; i < x.length; i++) {
      prediction += x[i] * model.weights[i];
    }
    return prediction;
  });
}

function calculateMAE(actual: number[], predicted: number[]): number {
  const sum = actual.reduce((acc, val, i) => acc + Math.abs(val - predicted[i]), 0);
  return sum / actual.length;
}

function calculateMAPE(actual: number[], predicted: number[]): number {
  let sum = 0;
  let count = 0;
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== 0) {
      sum += Math.abs((actual[i] - predicted[i]) / actual[i]) * 100;
      count++;
    }
  }
  return count > 0 ? sum / count : 0;
}

export async function runBacktest(
  candles: Candle[],
  options: { lookback?: number } = {}
): Promise<BacktestSummary> {
  const { lookback = SEQUENCE_LENGTH } = options;
  
  if (candles.length < lookback + 50) {
    throw new Error('Not enough data for backtesting');
  }
  
  const closes = candles.map(c => c.close);
  const times = candles.map(c => c.time);
  
  const { min, max, normalized } = normalizeData(closes);
  
  const splitIndex = Math.floor(closes.length * TRAIN_RATIO);
  
  const trainData = normalized.slice(0, splitIndex);
  const testDataNormalized = normalized.slice(splitIndex - lookback);
  const testPricesActual = closes.slice(splitIndex);
  const testTimes = times.slice(splitIndex);
  
  const { X: XTrain, y: yTrain } = createSequences(trainData, lookback);
  
  const model = trainLinearModel(XTrain, yTrain);
  
  const predictions: number[] = [];
  
  for (let i = 0; i < testDataNormalized.length - lookback; i++) {
    const window = testDataNormalized.slice(i, i + lookback);
    predictions.push(...predictLinear(model, [window]));
  }
  
  const predictedPrices = predictions.map(p => denormalize(p, min, max));
  
  const actualPrices = testPricesActual.slice(1);
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
  
  const directionAccuracy = actualPrices.length > 1 
    ? (correctDirection / (actualPrices.length - 1)) * 100 
    : 0;
  
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
    totalDirection: actualPrices.length > 1 ? actualPrices.length - 1 : 0,
    directionAccuracy
  };
}
