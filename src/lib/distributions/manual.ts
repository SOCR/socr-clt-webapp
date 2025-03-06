
import { Distribution } from './types';
import { normalizeBins } from '../manualDistributionUtils';

// Manual distribution
export const manualDist: Distribution = {
  name: "Manual Distribution",
  generate: (params) => {
    const bins = params.bins || [];
    const totalWeight = bins.reduce((sum: number, bin: number) => sum + bin, 0);
    
    if (totalWeight === 0) {
      // If no bins are defined, return uniform
      return Math.random() * bins.length;
    }
    
    // Normalize probabilities
    const probabilities = normalizeBins(bins);
    
    // Generate a random number based on the manual distribution
    const rand = Math.random();
    let cumProb = 0;
    
    for (let i = 0; i < probabilities.length; i++) {
      cumProb += probabilities[i];
      if (rand <= cumProb) {
        // Add small noise to avoid exact bin centers
        const noise = (Math.random() - 0.5) * 0.8;
        return i + 0.5 + noise;
      }
    }
    
    // Fallback to last bin
    return probabilities.length - 0.5;
  },
  
  // Add PDF function to be consistent with other distributions
  pdf: (x: number, params: any) => {
    const bins = params.bins || [];
    const totalWeight = bins.reduce((sum: number, bin: number) => sum + bin, 0);
    
    if (totalWeight === 0) return 1 / bins.length; // Uniform if no weights
    
    // Get bin index
    const binIndex = Math.floor(x);
    if (binIndex < 0 || binIndex >= bins.length) return 0;
    
    // Return normalized bin height
    return bins[binIndex] / totalWeight;
  }
};
