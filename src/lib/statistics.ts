
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

// New Function: Calculate Kolmogorov-Smirnov statistic against normal distribution
export const calculateKSStatistic = (data: number[]): number => {
  if (data.length < 3) return 0;
  
  // Sort the data
  const sortedData = [...data].sort((a, b) => a - b);
  
  // Calculate mean and standard deviation for a normal distribution
  const mean = calculateMean(sortedData);
  const sd = calculateSD(sortedData);
  
  if (sd === 0) return 0;
  
  // Calculate empirical CDF
  const n = sortedData.length;
  let maxDifference = 0;
  
  for (let i = 0; i < n; i++) {
    // Empirical CDF at this point
    const empiricalCDF = (i + 1) / n;
    
    // Theoretical CDF (normal distribution)
    const z = (sortedData[i] - mean) / sd;
    const theoreticalCDF = 0.5 * (1 + Math.erf(z / Math.sqrt(2)));
    
    // Calculate difference and update max if needed
    const difference = Math.abs(empiricalCDF - theoreticalCDF);
    if (difference > maxDifference) {
      maxDifference = difference;
    }
  }
  
  return maxDifference;
};

// New Function: Calculate Kullback-Leibler divergence against normal distribution
export const calculateKLDivergence = (data: number[], bins: number = 20): number => {
  if (data.length < 3) return 0;
  
  // Calculate histogram for empirical distribution
  const { breaks, counts } = calculateBins(data, bins);
  
  // Calculate mean and standard deviation for the reference normal distribution
  const mean = calculateMean(data);
  const sd = calculateSD(data);
  
  if (sd === 0) return 0;
  
  // Calculate bin width
  const binWidth = breaks[1] - breaks[0];
  
  // Normalize counts to get probabilities (empirical PDF)
  const totalCount = counts.reduce((sum, count) => sum + count, 0);
  const empiricalPDF = counts.map(count => count / totalCount / binWidth);
  
  // Calculate KL divergence
  let kl = 0;
  for (let i = 0; i < breaks.length - 1; i++) {
    // Skip bins with zero probability in empirical distribution
    if (empiricalPDF[i] <= 0) continue;
    
    // Center of the bin
    const binCenter = (breaks[i] + breaks[i + 1]) / 2;
    
    // Normal PDF at bin center
    const z = (binCenter - mean) / sd;
    const normalPDF = Math.exp(-0.5 * z * z) / (sd * Math.sqrt(2 * Math.PI));
    
    // Add to KL divergence if normal PDF is positive
    if (normalPDF > 0) {
      kl += empiricalPDF[i] * Math.log(empiricalPDF[i] / normalPDF) * binWidth;
    }
  }
  
  return kl;
};
