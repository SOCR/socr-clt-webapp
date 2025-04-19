
import { Distribution } from './types';
import { normal } from './continuous';

// Multivariate normal distribution (simplified version)
export const multivariateNormal: Distribution = {
  name: "Multivariate Normal Distribution",
  category: "multivariate",
  generate: (params) => {
    // For simplicity, we'll just generate a 2D point and return its magnitude
    // In a real implementation, this would return a vector
    const mean = params.mean !== undefined ? params.mean : 0;
    const sd = params.sd !== undefined ? params.sd : 1;
    const x = normal.generate({ mean, sd });
    const y = normal.generate({ mean, sd });
    return Math.sqrt(x*x + y*y); // Return magnitude as a scalar
  },
  params: {
    mean: {
      name: "Mean",
      description: "Mean of each dimension",
      default: 0,
      min: -10,
      max: 10,
      step: 0.1
    },
    sd: {
      name: "Standard Deviation",
      description: "Standard deviation of each dimension",
      default: 1,
      min: 0.1,
      max: 10,
      step: 0.1
    }
  }
};

// Dirichlet distribution (simplified)
export const dirichlet: Distribution = {
  name: "Dirichlet Distribution",
  category: "multivariate",
  generate: (params) => {
    // Simplified for educational purposes - returns just the first component
    const alpha = params.alpha || [1, 1];
    if (!Array.isArray(alpha) || alpha.length < 2) {
      return 0.5; // Default for invalid params
    }
    
    // Generate gamma samples
    const samples = alpha.map(a => {
      // Simple gamma approximation
      let shape = a;
      const u = Math.random();
      if (shape >= 1) {
        const d = shape - 1/3;
        const c = 1 / Math.sqrt(9 * d);
        let x, v;
        do {
          x = normal.generate({ mean: 0, sd: 1 });
          v = 1 + c * x;
        } while (v <= 0);
        
        v = v * v * v;
        return d * v;
      } else {
        // Simple approximation for shape < 1
        return Math.random() * shape;
      }
    });
    
    // Normalize to get a point on the simplex
    const sum = samples.reduce((a, b) => a + b, 0);
    const normalized = samples.map(s => s / sum);
    
    return normalized[0]; // Return first component for simplicity
  },
  params: {
    alpha: {
      name: "Alpha",
      description: "Concentration parameters (using default value [1,1])",
      default: 1,
      min: 0.1,
      max: 10,
      step: 0.1
    }
  }
};

// Wishart distribution (simplified)
export const wishart: Distribution = {
  name: "Wishart Distribution",
  category: "multivariate",
  generate: (params) => {
    // Very simplified implementation for educational purposes
    const df = params.df || 3;
    const scale = params.scale || 1;
    // Just return a scalar approximation for demonstration
    let sum = 0;
    for (let i = 0; i < df; i++) {
      const x = normal.generate({ mean: 0, sd: Math.sqrt(scale) });
      sum += x * x;
    }
    return sum;
  },
  params: {
    df: {
      name: "Degrees of Freedom",
      description: "Degrees of freedom parameter",
      default: 3,
      min: 1,
      max: 20,
      step: 1
    },
    scale: {
      name: "Scale",
      description: "Scale parameter",
      default: 1,
      min: 0.1,
      max: 10,
      step: 0.1
    }
  }
};
