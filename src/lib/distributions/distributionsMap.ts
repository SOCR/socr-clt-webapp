
import { DistributionMap } from './types';
import { 
  normalDist, 
  uniformDist, 
  exponentialDist, 
  cauchyDist, 
  triangularDist,
  laplaceDist
} from './continuous/basic';
import { 
  gammaDist, 
  weibullDist, 
  betaDist 
} from './continuous/advanced';
import { 
  bernoulliDist, 
  binomialDist, 
  poissonDist 
} from './discrete/basic';
import { 
  chiSquaredDist, 
  studentTDist 
} from './discrete/advanced';
import { manualDist } from './manual';

// Collect all distributions into a single map
export const distributions: DistributionMap = {
  // Manual
  manual: manualDist,
  
  // Continuous: Basic
  normal: normalDist,
  uniform: uniformDist,
  exponential: exponentialDist,
  cauchy: cauchyDist,
  triangular: triangularDist,
  laplace: laplaceDist,
  
  // Continuous: Advanced
  gamma: gammaDist,
  weibull: weibullDist,
  beta: betaDist,
  
  // Discrete: Basic
  bernoulli: bernoulliDist,
  binomial: binomialDist,
  poisson: poissonDist,
  
  // Discrete: Advanced
  chiSquared: chiSquaredDist,
  studentT: studentTDist
};
