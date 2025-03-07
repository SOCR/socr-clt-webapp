
import { Distribution } from './types';

// Bernoulli distribution
export const bernoulli: Distribution = {
  name: "Bernoulli Distribution",
  category: "discrete",
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

// Binomial distribution
export const binomial: Distribution = {
  name: "Binomial Distribution",
  category: "discrete",
  generate: (params) => {
    const { n, p } = params;
    let successes = 0;
    
    for (let i = 0; i < n; i++) {
      if (Math.random() < p) {
        successes++;
      }
    }
    
    return successes;
  },
  pdf: (x, params) => {
    const { n, p } = params;
    if (x < 0 || x > n || !Number.isInteger(x)) return 0;
    
    // Calculate binomial coefficient
    const binomCoeff = factorial(n) / (factorial(x) * factorial(n - x));
    return binomCoeff * Math.pow(p, x) * Math.pow(1 - p, n - x);
  }
};

// Poisson distribution
export const poisson: Distribution = {
  name: "Poisson Distribution",
  category: "discrete",
  generate: (params) => {
    const L = Math.exp(-params.lambda);
    let k = 0;
    let p = 1;
    
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    
    return k - 1;
  },
  pdf: (x, params) => {
    const { lambda } = params;
    if (x < 0 || !Number.isInteger(x)) return 0;
    
    return (Math.exp(-lambda) * Math.pow(lambda, x)) / factorial(x);
  }
};

// Geometric distribution
export const geometric: Distribution = {
  name: "Geometric Distribution",
  category: "discrete",
  generate: (params) => {
    const { p } = params;
    // Number of failures before the first success
    return Math.floor(Math.log(Math.random()) / Math.log(1 - p));
  },
  pdf: (x, params) => {
    const { p } = params;
    if (x < 0 || !Number.isInteger(x)) return 0;
    
    return p * Math.pow(1 - p, x);
  }
};

// Negative binomial distribution
export const negativeBinomial: Distribution = {
  name: "Negative Binomial Distribution",
  category: "discrete",
  generate: (params) => {
    const { r, p } = params;
    let successes = 0;
    let failures = 0;
    
    // Count failures until r successes
    while (successes < r) {
      if (Math.random() < p) {
        successes++;
      } else {
        failures++;
      }
    }
    
    return failures;
  },
  pdf: (x, params) => {
    const { r, p } = params;
    if (x < 0 || !Number.isInteger(x)) return 0;
    
    // Calculate combination (x+r-1 choose x)
    const combination = factorial(x + r - 1) / (factorial(x) * factorial(r - 1));
    return combination * Math.pow(p, r) * Math.pow(1 - p, x);
  }
};

// Helper function: Factorial calculation
function factorial(n: number): number {
  if (n === 0 || n === 1) return 1;
  if (n < 0 || !Number.isInteger(n)) return NaN;
  
  // For small n, use direct calculation
  if (n <= 20) {
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }
  
  // For larger n, use Stirling's approximation
  return Math.sqrt(2 * Math.PI * n) * Math.pow(n / Math.E, n);
}
