import React, { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { SimulationContext } from "@/contexts/SimulationContext";
import { 
  calculateMean, calculateVariance, calculateSD,
  calculateMedian, calculateSkewness, calculateKurtosis,
  calculateRange, calculateIQR, calculateBins,
  distributions
} from "@/lib/distributions";
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Index = () => {
  const navigate = useNavigate();
  const { 
    selectedDistribution, 
    distributionParams, 
    sampleSize, 
    numSamples, 
    samples, 
    statistics, 
    generateSamples 
  } = useContext(SimulationContext);
  
  useEffect(() => {
    generateSamples();
  }, [selectedDistribution, distributionParams, sampleSize, numSamples]);
  
  const chartData = {
    labels: calculateBins(samples.flat(), 10).map((bin, index) => `Bin ${index + 1}`),
    datasets: [
      {
        label: 'Sample Distribution',
        data: calculateBins(samples.flat(), 10).map(bin => {
          return samples.flat().filter(x => x >= bin.min && x < bin.max).length;
        }),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Distribution of Samples',
      },
    },
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Sampling Distribution Simulator</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white shadow-md rounded-md">
          <CardHeader>
            <CardTitle>Controls</CardTitle>
            <CardDescription>Adjust the simulation parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DistributionSelector />
            <SampleSizeControl />
            <NumSamplesControl />
            <Button onClick={generateSamples} className="w-full">Generate Samples</Button>
            <Button onClick={() => navigate('/manual-drawing')} className="w-full" variant="secondary">
              Go to Manual Drawing
            </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-md rounded-md md:col-span-2">
          <CardHeader>
            <CardTitle>Sample Distribution</CardTitle>
            <CardDescription>Visualization of the generated samples</CardDescription>
          </CardHeader>
          <CardContent>
            <Bar options={chartOptions} data={chartData} />
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <Card className="bg-white shadow-md rounded-md">
          <CardHeader>
            <CardTitle>Population Statistics</CardTitle>
            <CardDescription>Statistics of the combined samples</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Statistic label="Mean" value={statistics.populationMean} />
            <Statistic label="Median" value={calculateMedian(samples.flat())} />
            <Statistic label="Variance" value={statistics.populationVariance} />
            <Statistic label="Standard Deviation" value={statistics.populationSD} />
            <Statistic label="Skewness" value={calculateSkewness(samples.flat())} />
            <Statistic label="Kurtosis" value={calculateKurtosis(samples.flat())} />
            <Statistic label="Range" value={calculateRange(samples.flat())} />
            <Statistic label="IQR" value={calculateIQR(samples.flat())} />
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-md rounded-md">
          <CardHeader>
            <CardTitle>Sample Means Statistics</CardTitle>
            <CardDescription>Statistics of the sample means</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Statistic label="Mean of Sample Means" value={statistics.sampleMeansMean} />
            <Statistic label="Variance of Sample Means" value={statistics.sampleMeansVariance} />
            <Statistic label="Standard Deviation of Sample Means" value={statistics.sampleMeansSD} />
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-md rounded-md">
          <CardHeader>
            <CardTitle>Raw Data</CardTitle>
            <CardDescription>First 10 samples</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside">
              {samples.slice(0, 10).map((sample, index) => (
                <li key={index}>{`[${sample.map(num => num.toFixed(2)).join(', ')}]`}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Statistic = ({ label, value }: { label: string, value: number }) => (
  <div className="flex justify-between">
    <Label>{label}</Label>
    <span>{value.toFixed(2)}</span>
  </div>
);

const DistributionSelector = () => {
  const { selectedDistribution, setSelectedDistribution, distributionParams, setDistributionParams } = useContext(SimulationContext);
  
  const handleDistributionChange = (value: string) => {
    setSelectedDistribution(value);
    // Reset parameters
    const defaultParams: any = {};
    if (distributions[value]) {
      switch (value) {
        case 'normal':
          defaultParams.mean = 0;
          defaultParams.sd = 1;
          break;
        case 'uniform':
          defaultParams.min = 0;
          defaultParams.max = 1;
          break;
        case 'exponential':
          defaultParams.lambda = 1;
          break;
        case 'cauchy':
          defaultParams.location = 0;
          defaultParams.scale = 1;
          break;
        case 'triangular':
          defaultParams.min = 0;
          defaultParams.max = 1;
          defaultParams.mode = 0.5;
          break;
        case 'logNormal':
          defaultParams.mu = 0;
          defaultParams.sigma = 1;
          break;
        case 'beta':
          defaultParams.alpha = 1;
          defaultParams.beta = 1;
          break;
        case 'gamma':
          defaultParams.k = 1;
          defaultParams.theta = 1;
          break;
        case 'weibull':
          defaultParams.k = 1;
          defaultParams.lambda = 1;
          break;
        case 'bernoulli':
          defaultParams.p = 0.5;
          break;
        case 'binomial':
          defaultParams.n = 10;
          defaultParams.p = 0.5;
          break;
        case 'poisson':
          defaultParams.lambda = 5;
          break;
        case 'geometric':
          defaultParams.p = 0.5;
          break;
        case 'negativeBinomial':
          defaultParams.r = 10;
          defaultParams.p = 0.5;
          break;
        case 'chiSquared':
          defaultParams.k = 5;
          break;
        case 'studentT':
          defaultParams.nu = 5;
          break;
        case 'fDistribution':
          defaultParams.d1 = 5;
          defaultParams.d2 = 5;
          break;
        default:
          break;
      }
    }
    setDistributionParams(defaultParams);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Distribution</Label>
        <Select value={selectedDistribution} onValueChange={handleDistributionChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select distribution" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual Drawing</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="uniform">Uniform</SelectItem>
            <SelectItem value="exponential">Exponential</SelectItem>
            <SelectItem value="cauchy">Cauchy</SelectItem>
            <SelectItem value="triangular">Triangular</SelectItem>
            <SelectItem value="logNormal">Log Normal</SelectItem>
            <SelectItem value="beta">Beta</SelectItem>
            <SelectItem value="gamma">Gamma</SelectItem>
            <SelectItem value="weibull">Weibull</SelectItem>
            <SelectItem value="bernoulli">Bernoulli</SelectItem>
            <SelectItem value="binomial">Binomial</SelectItem>
            <SelectItem value="poisson">Poisson</SelectItem>
            <SelectItem value="geometric">Geometric</SelectItem>
            <SelectItem value="negativeBinomial">Negative Binomial</SelectItem>
            <SelectItem value="chiSquared">Chi-Squared</SelectItem>
            <SelectItem value="studentT">Student's t</SelectItem>
            <SelectItem value="fDistribution">F Distribution</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {selectedDistribution === 'normal' && (
        <>
          <ParameterInput label="Mean" param="mean" />
          <ParameterInput label="Standard Deviation" param="sd" />
        </>
      )}
      {selectedDistribution === 'uniform' && (
        <>
          <ParameterInput label="Min" param="min" />
          <ParameterInput label="Max" param="max" />
        </>
      )}
      {selectedDistribution === 'exponential' && (
        <ParameterInput label="Lambda" param="lambda" />
      )}
      {selectedDistribution === 'cauchy' && (
        <>
          <ParameterInput label="Location" param="location" />
          <ParameterInput label="Scale" param="scale" />
        </>
      )}
      {selectedDistribution === 'triangular' && (
        <>
          <ParameterInput label="Min" param="min" />
          <ParameterInput label="Max" param="max" />
          <ParameterInput label="Mode" param="mode" />
        </>
      )}
      {selectedDistribution === 'logNormal' && (
        <>
          <ParameterInput label="Mu" param="mu" />
          <ParameterInput label="Sigma" param="sigma" />
        </>
      )}
      {selectedDistribution === 'beta' && (
        <>
          <ParameterInput label="Alpha" param="alpha" />
          <ParameterInput label="Beta" param="beta" />
        </>
      )}
      {selectedDistribution === 'gamma' && (
        <>
          <ParameterInput label="k" param="k" />
          <ParameterInput label="Theta" param="theta" />
        </>
      )}
      {selectedDistribution === 'weibull' && (
        <>
          <ParameterInput label="k" param="k" />
          <ParameterInput label="Lambda" param="lambda" />
        </>
      )}
      {selectedDistribution === 'bernoulli' && (
        <ParameterInput label="p" param="p" />
      )}
      {selectedDistribution === 'binomial' && (
        <>
          <ParameterInput label="n" param="n" />
          <ParameterInput label="p" param="p" />
        </>
      )}
      {selectedDistribution === 'poisson' && (
        <ParameterInput label="Lambda" param="lambda" />
      )}
      {selectedDistribution === 'geometric' && (
        <ParameterInput label="p" param="p" />
      )}
      {selectedDistribution === 'negativeBinomial' && (
        <>
          <ParameterInput label="r" param="r" />
          <ParameterInput label="p" param="p" />
        </>
      )}
      {selectedDistribution === 'chiSquared' && (
        <ParameterInput label="k" param="k" />
      )}
      {selectedDistribution === 'studentT' && (
        <ParameterInput label="nu" param="nu" />
      )}
      {selectedDistribution === 'fDistribution' && (
        <>
          <ParameterInput label="d1" param="d1" />
          <ParameterInput label="d2" param="d2" />
        </>
      )}
    </div>
  );
};

const ParameterInput = ({ label, param }: { label: string, param: string }) => {
  const { distributionParams, setDistributionParams } = useContext(SimulationContext);
  
  const handleParamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDistributionParams({ ...distributionParams, [param]: parseFloat(e.target.value) });
  };

  return (
    <div>
      <Label>{label}</Label>
      <Input type="number" value={distributionParams[param]} onChange={handleParamChange} />
    </div>
  );
};

const SampleSizeControl = () => {
  const { sampleSize, setSampleSize } = useContext(SimulationContext);

  return (
    <div>
      <Label>Sample Size: {sampleSize}</Label>
      <Slider
        value={[sampleSize]}
        min={10}
        max={1000}
        step={10}
        onValueChange={(value) => setSampleSize(value[0])}
        className="my-2"
      />
    </div>
  );
};

const NumSamplesControl = () => {
  const { numSamples, setNumSamples } = useContext(SimulationContext);

  return (
    <div>
      <Label>Number of Samples: {numSamples}</Label>
      <Slider
        value={[numSamples]}
        min={100}
        max={1000}
        step={10}
        onValueChange={(value) => setNumSamples(value[0])}
        className="my-2"
      />
    </div>
  );
};

export default Index;
