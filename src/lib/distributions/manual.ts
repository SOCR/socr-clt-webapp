
import { Distribution } from './types';
import { normalizeBins } from '../manualDistributionUtils';

// Manual distribution
export const manualDist: Distribution = {
  name: "Manual Density",
  generate: (params) => {
    const bins = params.bins || [];
    const totalWeight = bins.reduce((sum: number, bin: number) => sum + bin, 0);
    
    if (totalWeight === 0) return 0;
    
    // Normalize probabilities
    const probabilities = normalizeBins(bins);
    
    // Generate a random number based on the manual distribution
    const rand = Math.random();
    let cumProb = 0;
    
    for (let i = 0; i < probabilities.length; i++) {
      cumProb += probabilities[i];
      if (rand <= cumProb) {
        // Return the midpoint of the selected bin
        return i + 0.5;
      }
    }
    
    return probabilities.length - 0.5; // Default to last bin
  }
};
