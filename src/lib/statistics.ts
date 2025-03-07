
// Calculate mean of an array
export const calculateMean = (data: number[]): number => {
  if (data.length === 0) return 0;
  return data.reduce((sum, val) => sum + val, 0) / data.length;
};

// Calculate variance of an array
export const calculateVariance = (data: number[], useBiased: boolean = false): number => {
  if (data.length < 2) return 0;
  
  const mean = calculateMean(data);
  const sumSquaredDiff = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
  
  // Biased estimator uses n, unbiased uses n-1
  const divisor = useBiased ? data.length : data.length - 1;
  
  return sumSquaredDiff / divisor;
};

// Calculate standard deviation of an array
export const calculateSD = (data: number[], useBiased: boolean = false): number => {
  return Math.sqrt(calculateVariance(data, useBiased));
};

// Calculate median of an array
export const calculateMedian = (data: number[]): number => {
  if (data.length === 0) return 0;
  
  const sortedData = [...data].sort((a, b) => a - b);
  const mid = Math.floor(sortedData.length / 2);
  
  if (sortedData.length % 2 === 0) {
    return (sortedData[mid - 1] + sortedData[mid]) / 2;
  } else {
    return sortedData[mid];
  }
};

// Calculate skewness of an array (third standardized moment)
export const calculateSkewness = (data: number[]): number => {
  if (data.length < 3) return 0;
  
  const mean = calculateMean(data);
  const sd = calculateSD(data);
  
  if (sd === 0) return 0;
  
  const sumCubedDiff = data.reduce((sum, val) => sum + Math.pow((val - mean) / sd, 3), 0);
  return (sumCubedDiff * data.length) / ((data.length - 1) * (data.length - 2));
};

// Calculate kurtosis of an array (fourth standardized moment - 3)
export const calculateKurtosis = (data: number[]): number => {
  if (data.length < 4) return 0;
  
  const mean = calculateMean(data);
  const sd = calculateSD(data);
  
  if (sd === 0) return 0;
  
  const sumQuartDiff = data.reduce((sum, val) => sum + Math.pow((val - mean) / sd, 4), 0);
  const n = data.length;
  
  // Unbiased estimator of excess kurtosis
  return ((n * (n + 1) * sumQuartDiff) / ((n - 1) * (n - 2) * (n - 3))) * 
         ((n - 1) * (n - 1) / ((n - 2) * (n - 3))) - 3;
};

// Calculate range
export const calculateRange = (data: number[]): number => {
  if (data.length === 0) return 0;
  const min = Math.min(...data);
  const max = Math.max(...data);
  return max - min;
};

// Calculate interquartile range
export const calculateIQR = (data: number[]): number => {
  if (data.length < 4) return 0;
  
  const sortedData = [...data].sort((a, b) => a - b);
  const q1Index = Math.floor(sortedData.length * 0.25);
  const q3Index = Math.floor(sortedData.length * 0.75);
  
  return sortedData[q3Index] - sortedData[q1Index];
};

// Calculate histogram bins using Sturges' rule
export const calculateBins = (data: number[], customBins?: number): { breaks: number[], counts: number[] } => {
  if (data.length === 0) return { breaks: [], counts: [] };
  
  // Get min and max values
  const min = Math.min(...data);
  const max = Math.max(...data);
  
  // Calculate number of bins using Sturges' rule if not provided
  const numBins = customBins || Math.ceil(1 + 3.322 * Math.log10(data.length));
  
  // Calculate bin width
  const binWidth = (max - min) / numBins;
  
  // Create bin breaks
  const breaks = Array.from({ length: numBins + 1 }, (_, i) => min + i * binWidth);
  
  // Initialize bin counts
  const counts = Array(numBins).fill(0);
  
  // Count data points in each bin
  data.forEach(value => {
    // Special case for max value, put it in the last bin
    if (value === max) {
      counts[numBins - 1]++;
    } else {
      const binIndex = Math.floor((value - min) / binWidth);
      // Ensure the index is within bounds
      if (binIndex >= 0 && binIndex < numBins) {
        counts[binIndex]++;
      }
    }
  });
  
  return { breaks, counts };
};
