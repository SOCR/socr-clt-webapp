// This file now just re-exports from the new modular structure
export * from './distributions/index';

// The code has been refactored into:
// - src/lib/distributions/types.ts - Type definitions
// - src/lib/distributions/continuous.ts - Continuous distributions
// - src/lib/distributions/discrete.ts - Discrete distributions
// - src/lib/distributions/sampling.ts - Sampling distributions
// - src/lib/distributions/multivariate.ts - Multivariate distributions
// - src/lib/statistics.ts - Statistical functions
// - src/lib/distributions/index.ts - Main exports and manual drawing functionality
