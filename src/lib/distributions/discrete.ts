
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

// Hypergeometric distribution
export const hypergeometric: Distribution = {
  name: "Hypergeometric Distribution",
  category: "discrete",
  generate: (params) => {
    const { N, K, n } = params;
    let successes = 0;
    let remaining = { success: K, failure: N - K };
    
    for (let i = 0; i < n; i++) {
      const total = remaining.success + remaining.failure;
      if (total <= 0) break;
      
      const p = remaining.success / total;
      if (Math.random() < p) {
        successes++;
        remaining.success--;
      } else {
        remaining.failure--;
      }
    }
    
    return successes;
  },
  pdf: (x, params) => {
    const { N, K, n } = params;
    if (x < Math.max(0, n + K - N) || x > Math.min(n, K) || !Number.isInteger(x)) return 0;
    
    // Calculate hypergeometric PMF
    const numerator = combination(K, x) * combination(N - K, n - x);
    const denominator = combination(N, n);
    
    return numerator / denominator;
  }
};

// Logarithmic distribution (also known as log-series distribution)
export const logarithmic: Distribution = {
  name: "Logarithmic Distribution",
  category: "discrete",
  generate: (params) => {
    const { p } = params;
    
    // Generate a random value from the logarithmic distribution
    const u = Math.random();
    let x = 1;
    let cdf = 0;
    
    while (u > cdf) {
      const pmf = -Math.pow(p, x) / (x * Math.log(1 - p));
      cdf += pmf;
      x++;
    }
    
    return x - 1;
  },
  pdf: (x, params) => {
    const { p } = params;
    if (x < 1 || !Number.isInteger(x)) return 0;
    
    return -Math.pow(p, x) / (x * Math.log(1 - p));
  }
};

// Zipf distribution
export const zipf: Distribution = {
  name: "Zipf Distribution",
  category: "discrete",
  generate: (params) => {
    const { s, N } = params;
    
    // Calculate the normalization constant (Hurwitz zeta function)
    let normalization = 0;
    for (let i = 1; i <= N; i++) {
      normalization += 1 / Math.pow(i, s);
    }
    
    // Generate a uniform random number
    const u = Math.random();
    let cdf = 0;
    
    // Find the value where CDF exceeds the random number
    for (let x = 1; x <= N; x++) {
      cdf += (1 / Math.pow(x, s)) / normalization;
      if (u <= cdf) {
        return x;
      }
    }
    
    return N; // Default to maximum value if something goes wrong
  },
  pdf: (x, params) => {
    const { s, N } = params;
    if (x < 1 || x > N || !Number.isInteger(x)) return 0;
    
    // Calculate the normalization constant
    let normalization = 0;
    for (let i = 1; i <= N; i++) {
      normalization += 1 / Math.pow(i, s);
    }
    
    return (1 / Math.pow(x, s)) / normalization;
  }
};

// Discrete uniform distribution
export const discreteUniform: Distribution = {
  name: "Discrete Uniform Distribution",
  category: "discrete",
  generate: (params) => {
    const { a, b } = params;
    return Math.floor(a + Math.random() * (b - a + 1));
  },
  pdf: (x, params) => {
    const { a, b } = params;
    if (x < a || x > b || !Number.isInteger(x)) return 0;
    
    return 1 / (b - a + 1);
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

// Helper function: Binomial coefficient (n choose k)
function combination(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  
  // Optimize by using the smaller k value
  k = Math.min(k, n - k);
  
  let result = 1;
  for (let i = 1; i <= k; i++) {
    result *= (n - (k - i));
    result /= i;
  }
  
  return result;
}
