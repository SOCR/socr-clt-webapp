
import { Distribution } from '../types';
import { normalDist } from '../continuous/basic';

// Advanced discrete distributions
export const chiSquaredDist: Distribution = {
  name: "Chi-Squared Distribution",
  generate: (params) => {
    const { df } = params;
    let sum = 0;
    // Sum of squares of df standard normal variables
    for (let i = 0; i < df; i++) {
      const z = normalDist.generate({ mean: 0, sd: 1 });
      sum += z * z;
    }
    return sum;
  }
};

export const studentTDist: Distribution = {
  name: "Student's t Distribution",
  generate: (params) => {
    const { df } = params;
    const z = normalDist.generate({ mean: 0, sd: 1 });
    const chi = chiSquaredDist.generate({ df });
    return z / Math.sqrt(chi / df);
  }
};
