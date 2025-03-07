
// Define a generic interface for distributions
export interface Distribution {
  name: string;
  category: DistributionCategory;
  generate: (params: any) => number;
  pdf?: (x: number, params: any) => number;
}

export type DistributionCategory = 
  | "continuous" 
  | "discrete" 
  | "multivariate" 
  | "sampling";

export interface DistributionMap {
  [key: string]: Distribution;
}
