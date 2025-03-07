
import React, { useState, useEffect } from 'react';
import { distributions, calculateMean, calculateSD, calculateMedian, calculateSkewness, calculateKurtosis } from '../lib/distributions';
import ManualDistribution from '../components/ManualDistribution';
import { normalizeBins, binsToDistribution } from '../lib/manualDistributionUtils';

const Index = () => {
  const [distParams, setDistParams] = useState<{ bins: number[] }>({ bins: Array(20).fill(0) });
  const [selectedDist, setSelectedDist] = useState('normal');
  const [manualBins, setManualBins] = useState(Array(20).fill(0));
  const [manualDistribution, setManualDistribution] = useState<((count: number) => number[]) | null>(null);
  const [generatedSamples, setGeneratedSamples] = useState<number[]>([]);

  useEffect(() => {
    const newDistribution = binsToDistribution(manualBins);
    setManualDistribution(newDistribution);
    
    // Update the distParams.bins when manual distribution is selected
    if (selectedDist === 'manual') {
      setDistParams({ ...distParams, bins: manualBins });
    }
  }, [manualBins, selectedDist]);

  useEffect(() => {
    // Generate samples when distribution changes
    if (selectedDist === 'manual' && manualDistribution) {
      const samples = manualDistribution(100);
      setGeneratedSamples(samples);
    } else if (distributions[selectedDist]) {
      const samples = Array(100).fill(0).map(() => 
        distributions[selectedDist].generate(distParams)
      );
      setGeneratedSamples(samples);
    }
  }, [selectedDist, distParams, manualDistribution]);

  const handleManualDensityDraw = (newBins: number[]) => {
    setManualBins(newBins);
    
    // Directly update distParams if manual distribution is selected
    if (selectedDist === 'manual') {
      setDistParams({ bins: newBins });
    }
  };
  
  const handleDistributionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newDist = event.target.value;
    setSelectedDist(newDist);
    
    // Reset parameters based on the new distribution type
    if (newDist === 'manual') {
      setDistParams({ bins: manualBins });
    } else {
      // Set appropriate default parameters for other distributions
      setDistParams({ bins: Array(20).fill(0) });
    }
  };

  // Helper function to calculate statistics for current distribution
  const calculateStatistics = () => {
    if (generatedSamples.length === 0) {
      return { mean: 0, sd: 0, median: 0, skewness: 0, kurtosis: 0 };
    }
    
    return {
      mean: calculateMean(generatedSamples),
      sd: calculateSD(generatedSamples),
      median: calculateMedian(generatedSamples),
      skewness: calculateSkewness(generatedSamples),
      kurtosis: calculateKurtosis(generatedSamples)
    };
  };

  const stats = calculateStatistics();

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Statistical Distribution Explorer</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Distribution Settings</h2>
          
          <div className="mb-4">
            <label htmlFor="distribution" className="block text-sm font-medium text-gray-700">
              Select Distribution
            </label>
            <select
              id="distribution"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              value={selectedDist}
              onChange={handleDistributionChange}
            >
              <optgroup label="Manual">
                <option value="manual">Manual Distribution</option>
              </optgroup>
              <optgroup label="Continuous: Basic">
                <option value="normal">Normal</option>
                <option value="uniform">Uniform</option>
                <option value="exponential">Exponential</option>
                <option value="cauchy">Cauchy</option>
                <option value="triangular">Triangular</option>
                <option value="laplace">Laplace</option>
              </optgroup>
              <optgroup label="Continuous: Advanced">
                <option value="gamma">Gamma</option>
                <option value="weibull">Weibull</option>
                <option value="beta">Beta</option>
              </optgroup>
              <optgroup label="Discrete: Basic">
                <option value="bernoulli">Bernoulli</option>
                <option value="binomial">Binomial</option>
                <option value="poisson">Poisson</option>
              </optgroup>
              <optgroup label="Discrete: Advanced">
                <option value="chiSquared">Chi-Squared</option>
                <option value="studentT">Student's t</option>
              </optgroup>
            </select>
          </div>
          
          {/* Distribution parameters UI */}
          <div className="mb-4">
            {selectedDist !== 'manual' && (
              <div className="text-sm text-gray-600">
                Using default parameters for {selectedDist} distribution.
                {/* Parameter controls will be added in future updates */}
              </div>
            )}
          </div>
          
          {selectedDist === 'manual' && (
            <div className="mt-4">
              <h3 className="text-md font-medium mb-2">Draw Distribution</h3>
              <ManualDistribution 
                bins={manualBins}
                onChange={handleManualDensityDraw}
                height={200}
                width={400}
              />
            </div>
          )}
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Distribution Visualization</h2>
          <div className="space-y-2">
            <p><strong>Selected Distribution:</strong> {selectedDist}</p>
            
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-sm font-medium">Mean</p>
                <p className="text-lg">{stats.mean.toFixed(4)}</p>
              </div>
              
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-sm font-medium">Standard Deviation</p>
                <p className="text-lg">{stats.sd.toFixed(4)}</p>
              </div>
              
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-sm font-medium">Median</p>
                <p className="text-lg">{stats.median.toFixed(4)}</p>
              </div>
              
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-sm font-medium">Skewness</p>
                <p className="text-lg">{stats.skewness.toFixed(4)}</p>
              </div>
              
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-sm font-medium">Kurtosis</p>
                <p className="text-lg">{stats.kurtosis.toFixed(4)}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-md font-medium mb-2">Sample Histogram</h3>
              <div className="h-48 bg-gray-100 rounded flex items-end justify-start p-2 overflow-hidden">
                {generatedSamples.length > 0 && (
                  <div className="flex h-full w-full items-end space-x-1">
                    {Array.from({ length: 20 }).map((_, index) => {
                      // Simple histogram binning
                      const min = Math.min(...generatedSamples);
                      const max = Math.max(...generatedSamples);
                      const binWidth = (max - min) / 20;
                      const binStart = min + index * binWidth;
                      const binEnd = binStart + binWidth;
                      
                      const binCount = generatedSamples.filter(
                        value => value >= binStart && value < binEnd
                      ).length;
                      
                      const maxCount = Math.max(1, ...generatedSamples.map(x => x));
                      const height = `${Math.max(5, (binCount / generatedSamples.length) * 100 * 3)}%`;
                      
                      return (
                        <div 
                          key={index}
                          className="bg-blue-500 w-full rounded-t"
                          style={{ height }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
