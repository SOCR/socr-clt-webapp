
import { Distribution } from './types';

// Normal distribution
export const normal: Distribution = {
  name: "Normal Distribution",
  category: "continuous",
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
};

// Uniform distribution
export const uniform: Distribution = {
  name: "Uniform Distribution",
  category: "continuous",
  generate: (params) => {
    return params.a + Math.random() * (params.b - params.a);
  },
  pdf: (x, params) => {
    const { a, b } = params;
    return (x >= a && x <= b) ? 1 / (b - a) : 0;
  }
};

// Exponential distribution
export const exponential: Distribution = {
  name: "Exponential Distribution",
  category: "continuous",
  generate: (params) => {
    return -Math.log(Math.random()) / params.lambda;
  },
  pdf: (x, params) => {
    const { lambda } = params;
    return (x >= 0) ? lambda * Math.exp(-lambda * x) : 0;
  }
};

// Cauchy distribution
export const cauchy: Distribution = {
  name: "Cauchy Distribution",
  category: "continuous",
  generate: (params) => {
    // Using the tangent method for Cauchy
    return params.location + params.scale * Math.tan(Math.PI * (Math.random() - 0.5));
  },
  pdf: (x, params) => {
    const { location, scale } = params;
    return (1 / (Math.PI * scale)) * 
           (1 / (1 + Math.pow((x - location) / scale, 2)));
  }
};

// Triangular distribution
export const triangular: Distribution = {
  name: "Triangular Distribution",
  category: "continuous",
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
};

// Log-normal distribution
export const logNormal: Distribution = {
  name: "Log-Normal Distribution",
  category: "continuous",
  generate: (params) => {
    const { mu, sigma } = params;
    const normalVal = normal.generate({ mean: mu, sd: sigma });
    return Math.exp(normalVal);
  },
  pdf: (x, params) => {
    const { mu, sigma } = params;
    if (x <= 0) return 0;
    const logX = Math.log(x);
    return (1 / (x * sigma * Math.sqrt(2 * Math.PI))) * 
           Math.exp(-0.5 * Math.pow((logX - mu) / sigma, 2));
  }
};

// Beta distribution (using rejection sampling)
export const beta: Distribution = {
  name: "Beta Distribution",
  category: "continuous",
  generate: (params) => {
    const { alpha, beta } = params;
    // Using Gamma distribution to generate Beta
    if (alpha > 0 && beta > 0) {
      const x = gamma.generate({ shape: alpha, scale: 1 });
      const y = gamma.generate({ shape: beta, scale: 1 });
      return x / (x + y);
    }
    return 0;
  },
  pdf: (x, params) => {
    const { alpha, beta } = params;
    if (x < 0 || x > 1) return 0;
    // Beta function approximation using Gamma functions
    const betaFunc = (a: number, b: number) => {
      return Math.exp(
        logGamma(a) + logGamma(b) - logGamma(a + b)
      );
    };
    return Math.pow(x, alpha - 1) * Math.pow(1 - x, beta - 1) / betaFunc(alpha, beta);
  }
};

// Gamma distribution (using Marsaglia and Tsang method)
export const gamma: Distribution = {
  name: "Gamma Distribution",
  category: "continuous",
  generate: (params) => {
    const { shape, scale } = params;
    // For shape < 1, use Ahrens-Dieter rejection method
    if (shape < 1) {
      const d = shape + 1.0 - 1.0/3.0;
      const c = 1.0 / Math.sqrt(9.0 * d);
      let x, v, u;
      do {
        do {
          x = normal.generate({ mean: 0, sd: 1 });
          v = 1.0 + c * x;
        } while (v <= 0);
        
        v = v * v * v;
        u = Math.random();
      } while (
        u > 1.0 - 0.331 * x * x * x * x && 
        Math.log(u) > 0.5 * x * x + d * (1.0 - v + Math.log(v))
      );
      
      return scale * d * v;
    }
    // For shape >= 1, use Marsaglia and Tsang method
    else {
      const d = shape - 1.0/3.0;
      const c = 1.0 / Math.sqrt(9.0 * d);
      let x, v;
      do {
        do {
          x = normal.generate({ mean: 0, sd: 1 });
          v = 1.0 + c * x;
        } while (v <= 0);
        
        v = v * v * v;
      } while (Math.random() > v / Math.exp(0.5 * x * x));
      
      return scale * d * v;
    }
  },
  pdf: (x, params) => {
    const { shape, scale } = params;
    if (x <= 0) return 0;
    
    // Gamma function approximation
    const logGammaFunc = logGamma(shape);
    return (1 / (Math.pow(scale, shape) * Math.exp(logGammaFunc))) * 
           Math.pow(x, shape - 1) * Math.exp(-x / scale);
  }
};

// Weibull distribution
export const weibull: Distribution = {
  name: "Weibull Distribution",
  category: "continuous",
  generate: (params) => {
    const { shape, scale } = params;
    return scale * Math.pow(-Math.log(Math.random()), 1 / shape);
  },
  pdf: (x, params) => {
    const { shape, scale } = params;
    if (x < 0) return 0;
    return (shape / scale) * Math.pow(x / scale, shape - 1) * 
           Math.exp(-Math.pow(x / scale, shape));
  }
};

// Pareto distribution
export const pareto: Distribution = {
  name: "Pareto Distribution",
  category: "continuous",
  generate: (params) => {
    const { scale, shape } = params;
    return scale / Math.pow(Math.random(), 1 / shape);
  },
  pdf: (x, params) => {
    const { scale, shape } = params;
    if (x < scale) return 0;
    return (shape * Math.pow(scale, shape)) / Math.pow(x, shape + 1);
  }
};

// Laplace distribution
export const laplace: Distribution = {
  name: "Laplace Distribution",
  category: "continuous",
  generate: (params) => {
    const { location, scale } = params;
    const u = Math.random() - 0.5;
    return location - scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  },
  pdf: (x, params) => {
    const { location, scale } = params;
    return (1 / (2 * scale)) * Math.exp(-Math.abs(x - location) / scale);
  }
};

// Rayleigh distribution
export const rayleigh: Distribution = {
  name: "Rayleigh Distribution",
  category: "continuous",
  generate: (params) => {
    const { scale } = params;
    return scale * Math.sqrt(-2 * Math.log(Math.random()));
  },
  pdf: (x, params) => {
    const { scale } = params;
    if (x < 0) return 0;
    return (x / (scale * scale)) * Math.exp(-(x * x) / (2 * scale * scale));
  }
};

// Maxwell-Boltzmann distribution
export const maxwellBoltzmann: Distribution = {
  name: "Maxwell-Boltzmann Distribution",
  category: "continuous",
  generate: (params) => {
    const { scale } = params;
    // Use Box-Muller transform for three normal variables
    let x, y, z;
    x = normal.generate({ mean: 0, sd: 1 });
    y = normal.generate({ mean: 0, sd: 1 });
    z = normal.generate({ mean: 0, sd: 1 });
    
    // Compute the magnitude of the vector (x,y,z)
    return scale * Math.sqrt(x*x + y*y + z*z);
  },
  pdf: (x, params) => {
    const { scale } = params;
    if (x < 0) return 0;
    return Math.sqrt(2/Math.PI) * 
           (x*x / Math.pow(scale, 3)) * 
           Math.exp(-x*x / (2*scale*scale));
  }
};

// Gumbel (extreme value) distribution
export const gumbel: Distribution = {
  name: "Gumbel Distribution",
  category: "continuous",
  generate: (params) => {
    const { location, scale } = params;
    return location - scale * Math.log(-Math.log(Math.random()));
  },
  pdf: (x, params) => {
    const { location, scale } = params;
    const z = (x - location) / scale;
    return (1 / scale) * Math.exp(-(z + Math.exp(-z)));
  }
};

// Logistic distribution
export const logistic: Distribution = {
  name: "Logistic Distribution",
  category: "continuous",
  generate: (params) => {
    const { location, scale } = params;
    const u = Math.random();
    return location + scale * Math.log(u / (1 - u));
  },
  pdf: (x, params) => {
    const { location, scale } = params;
    const z = (x - location) / scale;
    const expNegZ = Math.exp(-z);
    return expNegZ / (scale * Math.pow(1 + expNegZ, 2));
  }
};

// Chi distribution
export const chi: Distribution = {
  name: "Chi Distribution",
  category: "continuous",
  generate: (params) => {
    const { df } = params;
    let sumSquares = 0;
    
    // Generate df standard normal variables and sum their squares
    for (let i = 0; i < df; i++) {
      const z = normal.generate({ mean: 0, sd: 1 });
      sumSquares += z * z;
    }
    
    return Math.sqrt(sumSquares);
  },
  pdf: (x, params) => {
    const { df } = params;
    if (x < 0) return 0;
    
    const halfDf = df / 2;
    return (Math.pow(2, 1 - halfDf) / Math.exp(logGamma(halfDf))) * 
           Math.pow(x, df - 1) * 
           Math.exp(-x * x / 2);
  }
};

// Inverse Gaussian (Wald) distribution
export const inverseGaussian: Distribution = {
  name: "Inverse Gaussian Distribution",
  category: "continuous",
  generate: (params) => {
    const { mu, lambda } = params;
    const v = normal.generate({ mean: 0, sd: 1 });
    const y = v * v;
    const x = mu + (mu * mu * y) / (2 * lambda) - 
              (mu / (2 * lambda)) * Math.sqrt(4 * mu * lambda * y + mu * mu * y * y);
    
    if (Math.random() <= mu / (mu + x)) {
      return x;
    } else {
      return mu * mu / x;
    }
  },
  pdf: (x, params) => {
    const { mu, lambda } = params;
    if (x <= 0) return 0;
    
    return Math.sqrt(lambda / (2 * Math.PI * Math.pow(x, 3))) * 
           Math.exp((-lambda * Math.pow(x - mu, 2)) / (2 * mu * mu * x));
  }
};

// Helper function: Log gamma function using Lanczos approximation
function logGamma(z: number): number {
  const p = [
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7
  ];
  
  if (z < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  
  z -= 1;
  let x = 0.99999999999980993;
  for (let i = 0; i < p.length; i++) {
    x += p[i] / (z + i + 1);
  }
  
  const t = z + p.length - 0.5;
  return Math.log(Math.sqrt(2 * Math.PI)) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}
