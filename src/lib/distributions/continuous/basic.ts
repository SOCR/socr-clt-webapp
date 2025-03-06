
import { Distribution } from '../types';

// Basic continuous distributions
export const normalDist: Distribution = {
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
};

export const uniformDist: Distribution = {
  name: "Uniform Distribution",
  generate: (params) => {
    return params.a + Math.random() * (params.b - params.a);
  },
  pdf: (x, params) => {
    const { a, b } = params;
    return (x >= a && x <= b) ? 1 / (b - a) : 0;
  }
};

export const exponentialDist: Distribution = {
  name: "Exponential Distribution",
  generate: (params) => {
    return -Math.log(Math.random()) / params.lambda;
  },
  pdf: (x, params) => {
    const { lambda } = params;
    return (x >= 0) ? lambda * Math.exp(-lambda * x) : 0;
  }
};

export const cauchyDist: Distribution = {
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
};

export const triangularDist: Distribution = {
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
};

export const laplaceDist: Distribution = {
  name: "Laplace Distribution",
  generate: (params) => {
    const { location, scale } = params;
    const u = Math.random() - 0.5;
    return location - scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  },
  pdf: (x, params) => {
    const { location, scale } = params;
    return (1/(2*scale)) * Math.exp(-Math.abs(x - location)/scale);
  }
};
