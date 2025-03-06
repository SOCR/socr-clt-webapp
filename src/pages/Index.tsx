import React, { useState, useEffect, useRef } from 'react';
import { distributions, calculateMean, calculateSD, calculateMedian, calculateSkewness, calculateKurtosis } from '../lib/distributions';
import ManualDistribution from '../components/ManualDistribution';
import { normalizeBins, binsToDistribution } from '../lib/manualDistributionUtils';

const Index = () => {
  const [distParams, setDistParams] = useState({ bins: Array(20).fill(0) });
  const [selectedDist, setSelectedDist] = useState('normal');
  const [manualBins, setManualBins] = useState(Array(20).fill(0));
  const [manualDistribution, setManualDistribution] = useState(null);

  useEffect(() => {
    const newDistribution = binsToDistribution(manualBins);
    setManualDistribution(newDistribution);
    
    // Update the distParams.bins when manual distribution is selected
    if (selectedDist === 'manual') {
      setDistParams({ ...distParams, bins: manualBins });
    }
  }, [manualBins, selectedDist]);

  const handleManualDensityDraw = (newBins: number[]) => {
    setManualBins(newBins);
    
    // Directly update distParams if manual distribution is selected
    if (selectedDist === 'manual') {
      setDistParams({ ...distParams, bins: newBins });
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
      setDistParams({});
    }
  };

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
          <div>
            {Object.keys(distributions[selectedDist]).map((param, index) => (
              <div key={index}>
                {/* Render parameter input fields based on the selected distribution */}
                {/* Example: */}
                {param}: <input type="number" />
              </div>
            ))}
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
          {/* Distribution visualization components */}
          <div>
            <p>Selected Distribution: {selectedDist}</p>
            <p>
              Mean: {calculateMean(distParams)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
