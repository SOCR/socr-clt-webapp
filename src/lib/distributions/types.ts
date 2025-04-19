
// Define a generic interface for distributions
export interface Distribution {
  name: string;
  category: DistributionCategory;
  generate: (params: any) => number;
  pdf?: (x: number, params: any) => number;
  cdf?: (x: number, params: any) => number;
  params?: {
    [key: string]: DistributionParam;
  };
}

export interface DistributionParam {
  name: string;
  description: string;
  default: number;
  min?: number;
  max?: number;
  step?: number;
}

export type DistributionCategory = 
  | "continuous" 
  | "discrete" 
  | "multivariate" 
  | "sampling";

export interface DistributionMap {
  [key: string]: Distribution;
}
