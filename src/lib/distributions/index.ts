
import { DistributionMap } from './types';
import * as continuous from './continuous';
import * as discrete from './discrete';
import * as sampling from './sampling';
import * as multivariate from './multivariate';

// Combine all distributions into a single map
export const distributions: DistributionMap = {
  // Continuous distributions
  normal: continuous.normal,
  uniform: continuous.uniform,
  exponential: continuous.exponential,
  cauchy: continuous.cauchy,
  triangular: continuous.triangular,
  logNormal: continuous.logNormal,
  beta: continuous.beta,
  gamma: continuous.gamma,
  weibull: continuous.weibull,
  pareto: continuous.pareto,
  laplace: continuous.laplace,
  rayleigh: continuous.rayleigh,
  maxwellBoltzmann: continuous.maxwellBoltzmann,
  gumbel: continuous.gumbel,
  logistic: continuous.logistic,
  chi: continuous.chi,
  inverseGaussian: continuous.inverseGaussian,
  
  // Discrete distributions
  bernoulli: discrete.bernoulli,
  binomial: discrete.binomial,
  poisson: discrete.poisson,
  geometric: discrete.geometric,
  negativeBinomial: discrete.negativeBinomial,
  hypergeometric: discrete.hypergeometric,
  logarithmic: discrete.logarithmic,
  zipf: discrete.zipf,
  discreteUniform: discrete.discreteUniform,
  
  // Sampling distributions
  chiSquared: sampling.chiSquared,
  studentT: sampling.studentT,
  fDistribution: sampling.fDistribution,
  
  // Multivariate distributions
  multivariateNormal: multivariate.multivariateNormal,
  dirichlet: multivariate.dirichlet,
  wishart: multivariate.wishart
};

// Re-export types
export * from './types';

// Add manual drawing capabilities
export interface ManualDrawnDistribution {
  points: [number, number][]; // [x, y] pairs for the PDF
  min: number;
  max: number;
}

export class ManualDistribution {
  private points: [number, number][] = [];
  private min: number = -3;
  private max: number = 3;
  private normalized: boolean = false;
  
  constructor(initialPoints?: [number, number][]) {
    if (initialPoints && initialPoints.length > 0) {
      this.points = [...initialPoints];
      this.min = Math.min(...initialPoints.map(p => p[0]));
      this.max = Math.max(...initialPoints.map(p => p[0]));
    }
  }
  
  addPoint(x: number, y: number): void {
    // Ensure y is non-negative
    const validY = Math.max(0, y);
    this.points.push([x, validY]);
    this.min = Math.min(this.min, x);
    this.max = Math.max(this.max, x);
    this.normalized = false;
  }
  
  clearPoints(): void {
    this.points = [];
    this.normalized = false;
  }
  
  getPoints(): [number, number][] {
    return [...this.points].sort((a, b) => a[0] - b[0]);
  }
  
  normalize(): void {
    if (this.points.length < 2 || this.normalized) return;
    
    // Sort points by x-coordinate
    const sortedPoints = this.getPoints();
    
    // Calculate area using trapezoidal rule
    let area = 0;
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const [x1, y1] = sortedPoints[i];
      const [x2, y2] = sortedPoints[i + 1];
      area += (x2 - x1) * (y1 + y2) / 2;
    }
    
    // Normalize points
    if (area !== 0) {
      this.points = sortedPoints.map(([x, y]) => [x, y / area]);
      this.normalized = true;
    }
  }
  
  getDistribution(): ManualDrawnDistribution {
    // Make sure points are normalized
    this.normalize();
    
    return {
      points: this.getPoints(),
      min: this.min,
      max: this.max
    };
  }
  
  // Approximate sampling from the manual distribution using rejection sampling
  sample(): number {
    if (this.points.length < 2) return 0;
    
    const sortedPoints = this.getPoints();
    const maxY = Math.max(...sortedPoints.map(p => p[1]));
    
    // Rejection sampling
    while (true) {
      // Generate a random x within the range
      const x = this.min + Math.random() * (this.max - this.min);
      
      // Find the y value at x through linear interpolation
      let y = 0;
      for (let i = 0; i < sortedPoints.length - 1; i++) {
        const [x1, y1] = sortedPoints[i];
        const [x2, y2] = sortedPoints[i + 1];
        
        if (x >= x1 && x <= x2) {
          // Linear interpolation
          y = y1 + (y2 - y1) * (x - x1) / (x2 - x1);
          break;
        }
      }
      
      // Accept or reject based on the height
      if (Math.random() * maxY <= y) {
        return x;
      }
    }
  }
}

// Re-export statistics
export { 
  calculateMean, calculateVariance, calculateSD,
  calculateMedian, calculateSkewness, calculateKurtosis,
  calculateRange, calculateIQR, calculateBins
} from '../statistics';
