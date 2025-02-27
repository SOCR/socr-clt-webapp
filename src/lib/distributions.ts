
// Define a generic interface for distributions
interface Distribution {
  name: string;
  generate: (params: any) => number;
  pdf?: (x: number, params: any) => number;
}

interface DistributionMap {
  [key: string]: Distribution;
}

// Define the distributions
export const distributions: DistributionMap = {
  normal: {
    name: "Normal Distribution",
    generate: (params) => {
      // Box-Muller transform implementation
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      return z0 * params.sd + params.mean;
    },
    pdf: (x, params) => {
      const { mean, sd } = params;
      return (1 / (sd * Math.sqrt(2 * Math.PI))) * 
             Math.exp(-0.5 * Math.pow((x - mean) / sd, 2));
    }
  },
  
  uniform: {
    name: "Uniform Distribution",
    generate: (params) => {
      return params.a + Math.random() * (params.b - params.a);
    },
    pdf: (x, params) => {
      const { a, b } = params;
      return (x >= a && x <= b) ? 1 / (b - a) : 0;
    }
  },
  
  exponential: {
    name: "Exponential Distribution",
    generate: (params) => {
      return -Math.log(Math.random()) / params.lambda;
    },
    pdf: (x, params) => {
      const { lambda } = params;
      return (x >= 0) ? lambda * Math.exp(-lambda * x) : 0;
    }
  },
  
  bernoulli: {
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
  },
  
  cauchy: {
    name: "Cauchy Distribution",
    generate: (params) => {
      // Using the tangent method for Cauchy
      return params.location + params.scale * Math.tan(Math.PI * (Math.random() - 0.5));
    },
    pdf: (x, params) => {
      const { location, scale } = params;
      return (1 / (Math.PI * scale)) * 
             (1 / (1 + Math.pow((x - location) / scale, 2)));
    }
  },
  
  triangular: {
    name: "Triangular Distribution",
    generate: (params) => {
      const { a, b, c } = params;
      const u = Math.random();
      if (u < (c - a) / (b - a)) {
        return a + Math.sqrt(u * (b - a) * (c - a));
      } else {
        return b - Math.sqrt((1 - u) * (b - a) * (b - c));
      }
    },
    pdf: (x, params) => {
      const { a, b, c } = params;
      if (x < a || x > b) return 0;
      if (x < c) {
        return (2 * (x - a)) / ((b - a) * (c - a));
      } else {
        return (2 * (b - x)) / ((b - a) * (b - c));
      }
    }
  },
  
  // Chi-squared distribution (degree of freedom parameter)
  chiSquared: {
    name: "Chi-Squared Distribution",
    generate: (params) => {
      const { df } = params;
      let sum = 0;
      // Sum of squares of df standard normal variables
      for (let i = 0; i < df; i++) {
        const z = distributions.normal.generate({ mean: 0, sd: 1 });
        sum += z * z;
      }
      return sum;
    }
  },
  
  // Student's t-distribution (degree of freedom parameter)
  studentT: {
    name: "Student's t Distribution",
    generate: (params) => {
      const { df } = params;
      const z = distributions.normal.generate({ mean: 0, sd: 1 });
      const chi = distributions.chiSquared.generate({ df });
      return z / Math.sqrt(chi / df);
    }
  },
  
  // Poisson distribution (lambda parameter)
  poisson: {
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
  },
  
  // Binomial distribution (n and p parameters)
  binomial: {
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
  }
};

// Utility functions for statistical calculations

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
