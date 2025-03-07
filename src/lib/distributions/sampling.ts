
import { Distribution } from './types';
import { normal } from './continuous';

// Chi-squared distribution
export const chiSquared: Distribution = {
  name: "Chi-Squared Distribution",
  category: "sampling",
  generate: (params) => {
    const { df } = params;
    let sum = 0;
    // Sum of squares of df standard normal variables
    for (let i = 0; i < df; i++) {
      const z = normal.generate({ mean: 0, sd: 1 });
      sum += z * z;
    }
    return sum;
  },
  pdf: (x, params) => {
    const { df } = params;
    if (x < 0) return 0;
    
    // Gamma function approximation for Chi-squared PDF
    const halfDf = df / 2;
    const gamma = Math.exp(logGamma(halfDf));
    return (1 / (Math.pow(2, halfDf) * gamma)) * 
           Math.pow(x, halfDf - 1) * Math.exp(-x / 2);
  }
};

// Student's t-distribution
export const studentT: Distribution = {
  name: "Student's t Distribution",
  category: "sampling",
  generate: (params) => {
    const { df } = params;
    const z = normal.generate({ mean: 0, sd: 1 });
    const chi = chiSquared.generate({ df });
    return z / Math.sqrt(chi / df);
  },
  pdf: (x, params) => {
    const { df } = params;
    
    // t-distribution PDF
    const gamma1 = Math.exp(logGamma((df + 1) / 2));
    const gamma2 = Math.exp(logGamma(df / 2));
    const coef = gamma1 / (Math.sqrt(df * Math.PI) * gamma2);
    return coef * Math.pow(1 + (x * x) / df, -(df + 1) / 2);
  }
};

// F-distribution
export const fDistribution: Distribution = {
  name: "F Distribution",
  category: "sampling",
  generate: (params) => {
    const { df1, df2 } = params;
    const chi1 = chiSquared.generate({ df: df1 });
    const chi2 = chiSquared.generate({ df: df2 });
    return (chi1 / df1) / (chi2 / df2);
  },
  pdf: (x, params) => {
    const { df1, df2 } = params;
    if (x < 0) return 0;
    
    const a = df1 / 2;
    const b = df2 / 2;
    const gamma1 = Math.exp(logGamma(a + b));
    const gamma2 = Math.exp(logGamma(a));
    const gamma3 = Math.exp(logGamma(b));
    
    const coef = (gamma1 / (gamma2 * gamma3)) * 
                 Math.pow(df1 / df2, a);
    
    return coef * Math.pow(x, a - 1) * 
           Math.pow(1 + (df1 * x) / df2, -(a + b));
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
