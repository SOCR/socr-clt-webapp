
// Define a generic interface for distributions
export interface Distribution {
  name: string;
  generate: (params: any) => number;
  pdf?: (x: number, params: any) => number;
}

export interface DistributionMap {
  [key: string]: Distribution;
}
