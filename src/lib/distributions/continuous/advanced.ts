
import { Distribution } from '../types';
import { gamma, beta } from '../specialFunctions';
import { normalDist } from './basic';

// Advanced continuous distributions
export const gammaDist: Distribution = {
  name: "Gamma Distribution",
  generate: (params) => {
    const { shape, scale } = params;
    let a = shape;
    let b = scale;
    
    if (shape < 1) {
      a = shape + 1;
    }
    
    // Marsaglia and Tsang's method
    const d = a - 1/3;
    const c = 1 / Math.sqrt(9 * d);
    let v, x, u;
    
    do {
      do {
        x = normalDist.generate({ mean: 0, sd: 1 });
        v = 1 + c * x;
      } while (v <= 0);
      
      v = v * v * v;
      u = Math.random();
      
    } while (u > 1 - 0.331 * Math.pow(x, 4) && 
             Math.log(u) > 0.5 * x * x + d * (1 - v + Math.log(v)));
    
    let result = d * v / b;
    
    if (shape < 1) {
      result *= Math.pow(Math.random(), 1/shape);
    }
    
    return result;
  },
  pdf: (x, params) => {
    const { shape, scale } = params;
    if (x < 0) return 0;
    return Math.pow(x, shape-1) * Math.exp(-x/scale) / 
           (Math.pow(scale, shape) * gamma(shape));
  }
};

export const weibullDist: Distribution = {
  name: "Weibull Distribution",
  generate: (params) => {
    const { shape, scale } = params;
    return scale * Math.pow(-Math.log(Math.random()), 1/shape);
  },
  pdf: (x, params) => {
    const { shape, scale } = params;
    if (x < 0) return 0;
    return (shape/scale) * Math.pow(x/scale, shape-1) * 
           Math.exp(-Math.pow(x/scale, shape));
  }
};

export const betaDist: Distribution = {
  name: "Beta Distribution",
  generate: (params) => {
    const { alpha, beta: betaParam } = params;
    const x = gammaDist.generate({ shape: alpha, scale: 1 });
    const y = gammaDist.generate({ shape: betaParam, scale: 1 });
    return x / (x + y);
  },
  pdf: (x, params) => {
    const { alpha, beta: betaParam } = params;
    if (x < 0 || x > 1) return 0;
    return Math.pow(x, alpha-1) * Math.pow(1-x, betaParam-1) / beta(alpha, betaParam);
  }
};
