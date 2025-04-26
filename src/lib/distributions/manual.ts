
import { Distribution } from './types';

// Class for creating and managing a manual distribution
export class ManualDistribution {
  private points: [number, number][] = [];
  private min: number = -5;
  private max: number = 5;
  private normalized: boolean = false;
  
  constructor(initialPoints?: [number, number][]) {
    if (initialPoints && initialPoints.length > 0) {
      this.points = [...initialPoints].sort((a, b) => a[0] - b[0]);
      this.min = Math.min(...initialPoints.map(p => p[0]));
      this.max = Math.max(...initialPoints.map(p => p[0]));
      this.normalize();
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
    this.min = -5;
    this.max = 5;
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
    if (area > 0) {
      this.points = sortedPoints.map(([x, y]) => [x, y / area]);
      this.normalized = true;
    }
  }
  
  // Calculate PDF value at a given point
  pdf(x: number): number {
    const sortedPoints = this.getPoints();
    if (sortedPoints.length < 2) return 0;
    
    // Check if x is within the range
    if (x < sortedPoints[0][0] || x > sortedPoints[sortedPoints.length - 1][0]) return 0;
    
    // Find the y value at x through linear interpolation
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const [x1, y1] = sortedPoints[i];
      const [x2, y2] = sortedPoints[i + 1];
      
      if (x >= x1 && x <= x2) {
        // Linear interpolation
        return y1 + (y2 - y1) * (x - x1) / (x2 - x1);
      }
    }
    
    return 0;
  }
  
  // Calculate CDF value at a given point
  cdf(x: number): number {
    const sortedPoints = this.getPoints();
    if (sortedPoints.length < 2) return 0;
    
    // If x is less than the minimum point, CDF is 0
    if (x < sortedPoints[0][0]) return 0;
    
    // If x is greater than the maximum point, CDF is 1
    if (x > sortedPoints[sortedPoints.length - 1][0]) return 1;
    
    // Compute CDF by integrating the PDF from min to x
    let cdf = 0;
    let prevX = sortedPoints[0][0];
    let prevY = sortedPoints[0][1];
    
    // Find the appropriate interval for x
    let i = 1;
    while (i < sortedPoints.length && sortedPoints[i][0] <= x) {
      const currentX = sortedPoints[i][0];
      const currentY = sortedPoints[i][1];
      
      // Add area of trapezoid
      cdf += (currentX - prevX) * (prevY + currentY) / 2;
      
      prevX = currentX;
      prevY = currentY;
      i++;
    }
    
    // Add final segment if needed
    if (x > prevX && i < sortedPoints.length) {
      const currentY = this.pdf(x);
      cdf += (x - prevX) * (prevY + currentY) / 2;
    }
    
    return cdf;
  }
  
  // Generate histogram data for visualization
  getHistogramData(bins: number = 50): { x: number, y: number }[] {
    if (this.points.length < 2) return [];
    
    const sortedPoints = this.getPoints();
    const xMin = sortedPoints[0][0];
    const xMax = sortedPoints[sortedPoints.length - 1][0];
    const step = (xMax - xMin) / bins;
    
    const histData: { x: number, y: number }[] = [];
    
    for (let i = 0; i <= bins; i++) {
      const x = xMin + i * step;
      const y = this.pdf(x);
      histData.push({ x, y });
    }
    
    return histData;
  }
  
  // Approximate sampling using rejection sampling
  sample(): number {
    if (this.points.length < 2) return 0;
    
    // Make sure points are normalized
    if (!this.normalized) {
      this.normalize();
    }
    
    const sortedPoints = this.getPoints();
    const maxY = Math.max(...sortedPoints.map(p => p[1]));
    
    // Rejection sampling with safety counter
    for (let attempts = 0; attempts < 100; attempts++) {
      // Generate a random x within the range
      const x = this.min + Math.random() * (this.max - this.min);
      
      // Calculate PDF value at x
      const y = this.pdf(x);
      
      // Accept or reject based on the height
      if (Math.random() * maxY <= y) {
        return x;
      }
    }
    
    // Fallback if rejection sampling fails after many attempts
    // Use inverse transform sampling as a backup method
    const u = Math.random();
    const sortedX = sortedPoints.map(p => p[0]);
    
    // Find x where CDF(x) >= u
    for (let i = 0; i < sortedX.length; i++) {
      if (this.cdf(sortedX[i]) >= u) {
        return sortedX[i];
      }
    }
    
    // If all else fails, return a point from the middle
    const middlePoint = Math.floor(sortedPoints.length / 2);
    return sortedPoints[middlePoint][0];
  }
  
  // Generate multiple samples
  generateSamples(n: number): number[] {
    return Array.from({ length: n }, () => this.sample());
  }
  
  // Get statistics about the distribution
  getStats() {
    if (this.points.length < 2) {
      return { mean: 0, variance: 0 };
    }
    
    // Approximate mean using numerical integration
    let meanNumerator = 0;
    let denominator = 0;
    
    const sortedPoints = this.getPoints();
    
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const [x1, y1] = sortedPoints[i];
      const [x2, y2] = sortedPoints[i + 1];
      
      // Trapezoidal rule for integration
      const area = (x2 - x1) * (y1 + y2) / 2;
      const midpoint = (x1 + x2) / 2;
      
      meanNumerator += midpoint * area;
      denominator += area;
    }
    
    const mean = denominator > 0 ? meanNumerator / denominator : 0;
    
    // Approximate variance using numerical integration
    let varianceNumerator = 0;
    
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const [x1, y1] = sortedPoints[i];
      const [x2, y2] = sortedPoints[i + 1];
      
      const area = (x2 - x1) * (y1 + y2) / 2;
      const midpoint = (x1 + x2) / 2;
      
      varianceNumerator += Math.pow(midpoint - mean, 2) * area;
    }
    
    const variance = denominator > 0 ? varianceNumerator / denominator : 0;
    
    return { mean, variance };
  }
}

// Manual distribution for the distribution catalog
export const manualDistribution: Distribution = {
  name: "Manual Distribution",
  category: "continuous",
  generate: (params) => {
    if (!params.distribution || !(params.distribution instanceof ManualDistribution)) {
      return 0;
    }
    return params.distribution.sample();
  },
  pdf: (x: number, params) => {
    if (!params.distribution || !(params.distribution instanceof ManualDistribution)) {
      return 0;
    }
    return params.distribution.pdf(x);
  },
  cdf: (x: number, params) => {
    if (!params.distribution || !(params.distribution instanceof ManualDistribution)) {
      return 0;
    }
    return params.distribution.cdf(x);
  },
  params: {
    info: {
      name: "Drawing",
      description: "Use the interactive canvas to draw your distribution",
      default: 0,
      min: 0,
      max: 1
    }
  }
};
