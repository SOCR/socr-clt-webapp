/**
 * Converts raw bin heights from the drawing to normalized probability values
 * @param bins Raw bin heights from the drawing
 * @returns Normalized bins that sum to 1
 */
export const normalizeBins = (bins: number[]): number[] => {
  const sum = bins.reduce((acc, val) => acc + val, 0);
  
  // If sum is 0, return uniform distribution
  if (sum === 0) {
    return bins.map(() => 1 / bins.length);
  }
  
  // Otherwise normalize to sum to 1
  return bins.map(bin => bin / sum);
};

/**
 * Converts normalized bins to a distribution for sampling
 * @param bins Normalized bin values
 * @returns A function that generates random samples from this distribution
 */
export const binsToDistribution = (bins: number[]): ((count: number) => number[]) => {
  return (count: number) => {
    const results: number[] = [];
    const normalizedBins = normalizeBins(bins);
    
    for (let i = 0; i < count; i++) {
      // Use the algorithm from the manual distribution generate function
      const rand = Math.random();
      let cumProb = 0;
      let selectedBin = 0;
      
      for (let j = 0; j < normalizedBins.length; j++) {
        cumProb += normalizedBins[j];
        if (rand <= cumProb) {
          selectedBin = j;
          break;
        }
      }
      
      // Return the midpoint of the bin plus some small random noise
      // to avoid all samples being exactly at bin centers
      const noise = (Math.random() - 0.5) * 0.8; // Noise within the bin
      results.push(selectedBin + 0.5 + noise);
    }
    
    return results;
  };
};
