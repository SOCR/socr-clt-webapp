
import { DistributionMap } from './types';
import * as continuous from './continuous';
import * as discrete from './discrete';
import * as sampling from './sampling';
import * as multivariate from './multivariate';
import { manualDistribution, ManualDistribution } from './manual';

// Combine all distributions into a single map
export const distributions: DistributionMap = {
  // Continuous distributions
  normal: continuous.normal,
  uniform: continuous.uniform,
  exponential: continuous.exponential,
  cauchy: continuous.cauchy,
  triangular: continuous.triangular,
  logNormal: continuous.logNormal,
  beta: continuous.beta,
  gamma: continuous.gamma,
  weibull: continuous.weibull,
  pareto: continuous.pareto,
  laplace: continuous.laplace,
  rayleigh: continuous.rayleigh,
  maxwellBoltzmann: continuous.maxwellBoltzmann,
  gumbel: continuous.gumbel,
  logistic: continuous.logistic,
  chi: continuous.chi,
  inverseGaussian: continuous.inverseGaussian,
  
  // Discrete distributions
  bernoulli: discrete.bernoulli,
  binomial: discrete.binomial,
  poisson: discrete.poisson,
  geometric: discrete.geometric,
  negativeBinomial: discrete.negativeBinomial,
  hypergeometric: discrete.hypergeometric,
  logarithmic: discrete.logarithmic,
  zipf: discrete.zipf,
  discreteUniform: discrete.discreteUniform,
  
  // Sampling distributions
  chiSquared: sampling.chiSquared,
  studentT: sampling.studentT,
  fDistribution: sampling.fDistribution,
  
  // Multivariate distributions
  multivariateNormal: multivariate.multivariateNormal,
  dirichlet: multivariate.dirichlet,
  wishart: multivariate.wishart,
  
  // Manual distribution
  manualDistribution: manualDistribution
};

// Re-export types
export * from './types';
export { ManualDistribution } from './manual';

// Re-export statistics
export { 
  calculateMean, calculateVariance, calculateSD,
  calculateMedian, calculateSkewness, calculateKurtosis,
  calculateRange, calculateIQR, calculateBins
} from '../statistics';
