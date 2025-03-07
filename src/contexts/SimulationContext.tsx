
import React, { createContext, useState, useEffect } from 'react';
import { 
  distributions, 
  ManualDistribution, 
  calculateMean, 
  calculateVariance, 
  calculateSD 
} from '@/lib/distributions';

interface SimulationContextType {
  selectedDistribution: string;
  setSelectedDistribution: (dist: string) => void;
  distributionParams: any;
  setDistributionParams: (params: any) => void;
  sampleSize: number;
  setSampleSize: (size: number) => void;
  numSamples: number;
  setNumSamples: (num: number) => void;
  samples: number[][];
  setSamples: (samples: number[][]) => void;
  manualDistribution: ManualDistribution;
  statistics: {
    populationMean: number;
    populationVariance: number;
    populationSD: number;
    sampleMeans: number[];
    sampleMeansMean: number;
    sampleMeansVariance: number;
    sampleMeansSD: number;
  };
  generateSamples: () => void;
}

export const SimulationContext = createContext<SimulationContextType>({} as SimulationContextType);

export const SimulationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [selectedDistribution, setSelectedDistribution] = useState<string>('normal');
  const [distributionParams, setDistributionParams] = useState<any>({ mean: 0, sd: 1 });
  const [sampleSize, setSampleSize] = useState<number>(30);
  const [numSamples, setNumSamples] = useState<number>(500);
  const [samples, setSamples] = useState<number[][]>([]);
  const [manualDistribution] = useState<ManualDistribution>(new ManualDistribution());
  const [statistics, setStatistics] = useState({
    populationMean: 0,
    populationVariance: 0,
    populationSD: 0,
    sampleMeans: [] as number[],
    sampleMeansMean: 0,
    sampleMeansVariance: 0,
    sampleMeansSD: 0
  });

  // Generate samples based on selected distribution and parameters
  const generateSamples = () => {
    let allSamples: number[][] = [];
    
    // Generate samples
    for (let i = 0; i < numSamples; i++) {
      let sample: number[] = [];
      
      for (let j = 0; j < sampleSize; j++) {
        // Handle manual distribution separately
        if (selectedDistribution === 'manual') {
          sample.push(manualDistribution.sample());
        } else if (distributions[selectedDistribution]) {
          sample.push(distributions[selectedDistribution].generate(distributionParams));
        } else {
          // Fallback to normal distribution
          sample.push(distributions.normal.generate({ mean: 0, sd: 1 }));
        }
      }
      
      allSamples.push(sample);
    }
    
    setSamples(allSamples);
    
    // Compute statistics
    // Flatten all samples for population statistics
    const population = allSamples.flat();
    const populationMean = calculateMean(population);
    const populationVariance = calculateVariance(population);
    const populationSD = calculateSD(population);
    
    // Compute sample means
    const sampleMeans = allSamples.map(sample => calculateMean(sample));
    const sampleMeansMean = calculateMean(sampleMeans);
    const sampleMeansVariance = calculateVariance(sampleMeans);
    const sampleMeansSD = calculateSD(sampleMeans);
    
    setStatistics({
      populationMean,
      populationVariance,
      populationSD,
      sampleMeans,
      sampleMeansMean,
      sampleMeansVariance,
      sampleMeansSD
    });
  };

  return (
    <SimulationContext.Provider value={{
      selectedDistribution,
      setSelectedDistribution,
      distributionParams,
      setDistributionParams,
      sampleSize,
      setSampleSize,
      numSamples,
      setNumSamples,
      samples,
      setSamples,
      manualDistribution,
      statistics,
      generateSamples
    }}>
      {children}
    </SimulationProvider>
  );
};
