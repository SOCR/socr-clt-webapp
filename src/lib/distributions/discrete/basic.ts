
import { Distribution } from '../types';

// Basic discrete distributions
export const bernoulliDist: Distribution = {
  name: "Bernoulli Distribution",
  generate: (params) => {
    return Math.random() < params.p ? 1 : 0;
  },
  pdf: (x, params) => {
    const { p } = params;
    if (x === 0) return 1 - p;
    if (x === 1) return p;
    return 0;
  }
};

export const binomialDist: Distribution = {
  name: "Binomial Distribution",
  generate: (params) => {
    const { n, p } = params;
    let successes = 0;
    
    for (let i = 0; i < n; i++) {
      if (Math.random() < p) {
        successes++;
      }
    }
    
    return successes;
  }
};

export const poissonDist: Distribution = {
  name: "Poisson Distribution",
  generate: (params) => {
    const L = Math.exp(-params.lambda);
    let k = 0;
    let p = 1;
    
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    
    return k - 1;
  }
};
