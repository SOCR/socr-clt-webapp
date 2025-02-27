
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useToast } from "@/components/ui/use-toast";
import { distributions } from "@/lib/distributions";

const CLTSampler = () => {
  const { toast } = useToast();
  const canvasRefs = {
    population: useRef<HTMLCanvasElement>(null),
    currentSample: useRef<HTMLCanvasElement>(null),
    samplingDistribution1: useRef<HTMLCanvasElement>(null),
    samplingDistribution2: useRef<HTMLCanvasElement>(null),
  };

  // Distribution and parameters state
  const [selectedDistribution, setSelectedDistribution] = useState("normal");
  const [distributionParams, setDistributionParams] = useState({ mean: 0, sd: 1, p: 0.5, lambda: 1, a: 0, b: 1 });
  
  // Sample size and number of samples state
  const [sampleSize, setSampleSize] = useState(5);
  const [numberOfSamples, setNumberOfSamples] = useState(0);
  const [maxSamples, setMaxSamples] = useState(1000);
  
  // Statistics options
  const [statistic1, setStatistic1] = useState("mean");
  const [statistic2, setStatistic2] = useState("variance");
  const [fitNormal1, setFitNormal1] = useState(true);
  const [fitNormal2, setFitNormal2] = useState(true);
  
  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(10);
  const [showStepAnimation, setShowStepAnimation] = useState(true);
  const [animationPoint, setAnimationPoint] = useState<{ x: number, y: number, value: number } | null>(null);
  
  // Data state
  const [populationData, setPopulationData] = useState<number[]>([]);
  const [currentSample, setCurrentSample] = useState<number[]>([]);
  const [currentDrawIndex, setCurrentDrawIndex] = useState(-1);
  const [samplingData1, setSamplingData1] = useState<number[]>([]);
  const [samplingData2, setSamplingData2] = useState<number[]>([]);
  
  // Summary statistics
  const [populationStats, setPopulationStats] = useState({ size: 0, mean: 0, median: 0, sd: 0, skewness: 0, kurtosis: 0 });
  const [sampleStats, setSampleStats] = useState({ size: 0, mean: 0, median: 0, sd: 0, skewness: 0, kurtosis: 0 });
  const [sampling1Stats, setSampling1Stats] = useState({ size: 0, mean: 0, median: 0, sd: 0, skewness: 0, kurtosis: 0 });
  const [sampling2Stats, setSampling2Stats] = useState({ size: 0, mean: 0, median: 0, sd: 0, skewness: 0, kurtosis: 0 });

  const animationRef = useRef<number | null>(null);
  const sampleStepAnimationRef = useRef<number | null>(null);

  // Initialize the distribution data on first load
  useEffect(() => {
    generatePopulationData();
  }, []);

  // Update the population data when distribution or its parameters change
  useEffect(() => {
    generatePopulationData();
  }, [selectedDistribution, distributionParams]);

  // Draw the histograms whenever data changes
  useEffect(() => {
    drawPopulationHistogram();
    drawCurrentSampleHistogram();
    drawSamplingDistribution1();
    drawSamplingDistribution2();
  }, [populationData, currentSample, samplingData1, samplingData2, fitNormal1, fitNormal2, animationPoint]);

  // Generate the population data based on the selected distribution
  const generatePopulationData = () => {
    const dist = distributions[selectedDistribution];
    const params = distributionParams;
    const data = [];
    
    // Generate 10000 data points for the population
    for (let i = 0; i < 10000; i++) {
      data.push(dist.generate(params));
    }
    
    setPopulationData(data);
    setPopulationStats(calculateStatistics(data));
    
    // Reset the sampling distributions
    resetSamplingDistributions();
  };

  // Calculate various statistics for a dataset
  const calculateStatistics = (data: number[]) => {
    if (data.length === 0) {
      return { size: 0, mean: 0, median: 0, sd: 0, skewness: 0, kurtosis: 0 };
    }
    
    const size = data.length;
    const mean = data.reduce((sum, val) => sum + val, 0) / size;
    
    // Sort data for median calculation
    const sortedData = [...data].sort((a, b) => a - b);
    const median = size % 2 === 0 
      ? (sortedData[size / 2 - 1] + sortedData[size / 2]) / 2 
      : sortedData[Math.floor(size / 2)];
    
    // Calculate variance, skewness, and kurtosis
    let sumSquaredDiff = 0;
    let sumCubedDiff = 0;
    let sumQuarticDiff = 0;
    
    for (const val of data) {
      const diff = val - mean;
      const squaredDiff = diff * diff;
      sumSquaredDiff += squaredDiff;
      sumCubedDiff += squaredDiff * diff;
      sumQuarticDiff += squaredDiff * squaredDiff;
    }
    
    const variance = sumSquaredDiff / size;
    const sd = Math.sqrt(variance);
    
    // Skewness
    const skewness = sumCubedDiff / (size * Math.pow(sd, 3));
    
    // Kurtosis (excess kurtosis = kurtosis - 3)
    const kurtosis = sumQuarticDiff / (size * Math.pow(sd, 4)) - 3;
    
    return {
      size,
      mean: Number(mean.toFixed(4)),
      median: Number(median.toFixed(4)),
      sd: Number(sd.toFixed(4)),
      skewness: Number(skewness.toFixed(4)),
      kurtosis: Number(kurtosis.toFixed(4))
    };
  };

  // Reset the sampling distributions
  const resetSamplingDistributions = () => {
    setNumberOfSamples(0);
    setSamplingData1([]);
    setSamplingData2([]);
    setCurrentSample([]);
    setCurrentDrawIndex(-1);
    setAnimationPoint(null);
    setSampleStats({ size: 0, mean: 0, median: 0, sd: 0, skewness: 0, kurtosis: 0 });
    setSampling1Stats({ size: 0, mean: 0, median: 0, sd: 0, skewness: 0, kurtosis: 0 });
    setSampling2Stats({ size: 0, mean: 0, median: 0, sd: 0, skewness: 0, kurtosis: 0 });
  };

  // Take a single sample with animation
  const takeSample = (enableAnimation = true) => {
    if (sampleStepAnimationRef.current !== null) {
      cancelAnimationFrame(sampleStepAnimationRef.current);
      sampleStepAnimationRef.current = null;
    }
    
    // Create a new empty sample array
    const newSample: number[] = [];
    setCurrentSample(newSample);
    setCurrentDrawIndex(-1);
    
    // If we're not showing the step animation or if this is part of continuous sampling, just sample all at once
    if (!showStepAnimation || !enableAnimation) {
      const completeSample = [];
      for (let i = 0; i < sampleSize; i++) {
        const randomIndex = Math.floor(Math.random() * populationData.length);
        completeSample.push(populationData[randomIndex]);
      }
      
      setCurrentSample(completeSample);
      const sampleStats = calculateStatistics(completeSample);
      setSampleStats(sampleStats);
      
      // Update sampling distributions
      updateSamplingDistributions(completeSample, sampleStats);
      
      setNumberOfSamples(prev => prev + 1);
    } else {
      // Start the step-by-step sampling animation
      let currentIndex = 0;
      
      const animateStep = () => {
        if (currentIndex < sampleSize) {
          const randomIndex = Math.floor(Math.random() * populationData.length);
          const value = populationData[randomIndex];
          
          // Update the current sample by adding the new value
          const updatedSample = [...newSample, value];
          newSample.push(value);
          setCurrentSample([...newSample]);
          setCurrentDrawIndex(currentIndex);
          
          // Get coordinates for animation
          if (canvasRefs.population.current) {
            const canvas = canvasRefs.population.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const min = Math.min(...populationData);
              const max = Math.max(...populationData);
              const margin = (max - min) * 0.1;
              const adjustedMin = min - margin;
              const adjustedMax = max + margin;
              
              const x = 30 + ((value - adjustedMin) / (adjustedMax - adjustedMin)) * (canvas.width - 40);
              const y = canvas.height / 2;
              
              setAnimationPoint({ x, y, value });
              
              // Animate the point falling from the population to the sample
              setTimeout(() => {
                setAnimationPoint(null);
              }, 500);
            }
          }
          
          currentIndex++;
          
          // Schedule the next animation step
          sampleStepAnimationRef.current = requestAnimationFrame(() => {
            setTimeout(animateStep, 1000 / animationSpeed);
          });
        } else {
          // Animation complete, update statistics
          setCurrentDrawIndex(-1);
          const sampleStats = calculateStatistics(newSample);
          setSampleStats(sampleStats);
          
          // Update sampling distributions
          updateSamplingDistributions(newSample, sampleStats);
          
          setNumberOfSamples(prev => prev + 1);
          
          sampleStepAnimationRef.current = null;
        }
      };
      
      // Start the animation
      animateStep();
    }
    
    // Check if we've reached the maximum number of samples
    if (numberOfSamples >= maxSamples) {
      stopAnimation();
      toast({
        title: "Maximum samples reached",
        description: `You've reached the maximum number of samples (${maxSamples})`,
      });
    }
  };

  // Update the sampling distributions with a new sample
  const updateSamplingDistributions = (sample: number[], stats: any) => {
    // Update first sampling distribution (default: mean)
    const stat1Value = getStatisticValue(sample, statistic1);
    setSamplingData1(prev => [...prev, stat1Value]);
    
    // Update second sampling distribution (default: variance)
    const stat2Value = getStatisticValue(sample, statistic2);
    setSamplingData2(prev => [...prev, stat2Value]);
    
    // Update the statistics for the sampling distributions
    if (samplingData1.length > 0) {
      setSampling1Stats(calculateStatistics([...samplingData1, stat1Value]));
      setSampling2Stats(calculateStatistics([...samplingData2, stat2Value]));
    }
  };

  // Get the value of a specific statistic from a sample
  const getStatisticValue = (sample: number[], statistic: string) => {
    const stats = calculateStatistics(sample);
    switch (statistic) {
      case "mean": return stats.mean;
      case "median": return stats.median;
      case "variance": return Math.pow(stats.sd, 2);
      case "sd": return stats.sd;
      case "min": return Math.min(...sample);
      case "max": return Math.max(...sample);
      case "range": return Math.max(...sample) - Math.min(...sample);
      case "skewness": return stats.skewness;
      case "kurtosis": return stats.kurtosis;
      default: return stats.mean;
    }
  };

  // Start continuous sampling animation
  const startAnimation = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    const animate = () => {
      // Don't start the next sample until the current one is complete
      if (sampleStepAnimationRef.current === null) {
        // For continuous sampling, disable the step-by-step animation
        takeSample(false);
      }
      
      animationRef.current = requestAnimationFrame(() => {
        setTimeout(animate, 1000 / animationSpeed);
      });
    };
    
    animate();
  };

  // Stop animation
  const stopAnimation = () => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (sampleStepAnimationRef.current !== null) {
      cancelAnimationFrame(sampleStepAnimationRef.current);
      sampleStepAnimationRef.current = null;
    }
    
    setIsAnimating(false);
  };

  // Clear all samples
  const clearSamples = () => {
    stopAnimation();
    resetSamplingDistributions();
    toast({
      title: "Samples cleared",
      description: "All sampling data has been reset.",
    });
  };

  // Draw the population histogram
  const drawPopulationHistogram = () => {
    if (!canvasRefs.population.current || populationData.length === 0) return;
    
    const canvas = canvasRefs.population.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    drawHistogram(ctx, canvas, populationData, 'rgb(59, 130, 246)', false);
    
    // Draw animation point if it exists
    if (animationPoint) {
      ctx.fillStyle = 'rgb(255, 0, 0)';
      ctx.beginPath();
      ctx.arc(animationPoint.x, animationPoint.y, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw the value text
      ctx.fillStyle = 'black';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(animationPoint.value.toFixed(2), animationPoint.x, animationPoint.y - 10);
    }
    
    // Highlight the current draw in the population
    if (currentDrawIndex >= 0 && currentDrawIndex < sampleSize && currentSample.length > 0) {
      const value = currentSample[currentDrawIndex];
      
      // Calculate the x position of the value
      const min = Math.min(...populationData);
      const max = Math.max(...populationData);
      const margin = (max - min) * 0.1;
      const adjustedMin = min - margin;
      const adjustedMax = max + margin;
      
      const x = 30 + ((value - adjustedMin) / (adjustedMax - adjustedMin)) * (canvas.width - 40);
      
      // Draw a vertical line at the current value
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 10);
      ctx.lineTo(x, canvas.height - 30);
      ctx.stroke();
    }
  };

  // Draw the current sample histogram
  const drawCurrentSampleHistogram = () => {
    if (!canvasRefs.currentSample.current) return;
    
    const canvas = canvasRefs.currentSample.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    if (currentSample.length === 0) {
      drawEmptyFrame(ctx, canvas.width, canvas.height);
      return;
    }
    
    drawHistogram(ctx, canvas, currentSample, 'rgb(239, 68, 68)', false);
    
    // Highlight the current draw in the sample
    if (currentDrawIndex >= 0 && currentDrawIndex < currentSample.length) {
      const value = currentSample[currentDrawIndex];
      
      // Calculate the x position of the value
      const min = Math.min(...currentSample);
      const max = Math.max(...currentSample);
      const margin = (max - min) * 0.1 || 0.5; // Add a small margin if min equals max
      const adjustedMin = min - margin;
      const adjustedMax = max + margin;
      
      const x = 30 + ((value - adjustedMin) / (adjustedMax - adjustedMin)) * (canvas.width - 40);
      
      // Draw a highlight at the current value
      ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(x, canvas.height - 30 - 20, 10, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw the value text
      ctx.fillStyle = 'red';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Draw ${currentDrawIndex + 1}: ${value.toFixed(2)}`, x, canvas.height - 10);
    }
  };

  // Draw the first sampling distribution histogram
  const drawSamplingDistribution1 = () => {
    if (!canvasRefs.samplingDistribution1.current || samplingData1.length === 0) return;
    
    const canvas = canvasRefs.samplingDistribution1.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    drawHistogram(ctx, canvas, samplingData1, 'rgb(34, 197, 94)', fitNormal1);
  };

  // Draw the second sampling distribution histogram
  const drawSamplingDistribution2 = () => {
    if (!canvasRefs.samplingDistribution2.current || samplingData2.length === 0) return;
    
    const canvas = canvasRefs.samplingDistribution2.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    drawHistogram(ctx, canvas, samplingData2, 'rgb(168, 85, 247)', fitNormal2);
  };

  // Generic function to draw a histogram
  const drawHistogram = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, data: number[], color: string, fitNormal: boolean) => {
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    // No data, just draw empty frame
    if (data.length === 0) {
      drawEmptyFrame(ctx, width, height);
      return;
    }
    
    // Calculate min and max for the data
    const min = Math.min(...data);
    const max = Math.max(...data);
    
    // Add a 10% margin on each side
    const margin = (max - min) * 0.1 || 0.5; // Add a small margin if min equals max
    const adjustedMin = min - margin;
    const adjustedMax = max + margin;
    
    // Get statistics for the data
    const stats = calculateStatistics(data);
    
    // Create bins
    const binCount = Math.min(Math.ceil(Math.sqrt(data.length)), 30);
    const binWidth = (adjustedMax - adjustedMin) / binCount;
    const bins = new Array(binCount).fill(0);
    
    // Count values in each bin
    for (const value of data) {
      const binIndex = Math.min(Math.floor((value - adjustedMin) / binWidth), binCount - 1);
      if (binIndex >= 0) {
        bins[binIndex]++;
      }
    }
    
    // Find the maximum bin count for scaling
    const maxBinCount = Math.max(...bins);
    
    // Draw the coordinate frame
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 10);
    ctx.lineTo(30, height - 30);
    ctx.lineTo(width - 10, height - 30);
    ctx.stroke();
    
    // Draw the histogram bars
    const barWidth = Math.max((width - 40) / binCount, 1);
    
    ctx.fillStyle = color;
    for (let i = 0; i < binCount; i++) {
      const barHeight = (bins[i] / maxBinCount) * (height - 40);
      ctx.fillRect(
        30 + i * barWidth,
        height - 30 - barHeight,
        barWidth - 1,
        barHeight
      );
    }
    
    // Draw a normal curve if requested
    if (fitNormal && data.length > 1) {
      drawNormalCurve(ctx, width, height, stats.mean, stats.sd, adjustedMin, adjustedMax, maxBinCount, data.length);
    }
    
    // Draw the axes labels
    drawAxesLabels(ctx, width, height, adjustedMin, adjustedMax, maxBinCount);
    
    // Draw the statistics
    drawStatistics(ctx, width, height, stats);
  };

  // Draw an empty frame for when there's no data
  const drawEmptyFrame = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 10);
    ctx.lineTo(30, height - 30);
    ctx.lineTo(width - 10, height - 30);
    ctx.stroke();
    
    ctx.fillStyle = '#999';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('No data available', width / 2, height / 2);
  };

  // Draw a normal curve overlay on a histogram
  const drawNormalCurve = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    mean: number, 
    sd: number, 
    min: number, 
    max: number, 
    maxBinCount: number,
    dataCount: number
  ) => {
    if (sd === 0) return;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const step = (max - min) / 100;
    let firstPoint = true;
    
    for (let x = min; x <= max; x += step) {
      // Calculate normal PDF for this x value
      const normalValue = (1 / (sd * Math.sqrt(2 * Math.PI))) * 
                          Math.exp(-0.5 * Math.pow((x - mean) / sd, 2));
      
      // Scale to fit canvas
      const scaledValue = normalValue * (height - 40) * dataCount * step / maxBinCount;
      
      const canvasX = 30 + ((x - min) / (max - min)) * (width - 40);
      const canvasY = height - 30 - scaledValue;
      
      if (firstPoint) {
        ctx.moveTo(canvasX, canvasY);
        firstPoint = false;
      } else {
        ctx.lineTo(canvasX, canvasY);
      }
    }
    
    ctx.stroke();
  };

  // Draw axes labels on a histogram
  const drawAxesLabels = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    min: number, 
    max: number, 
    maxBinCount: number
  ) => {
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    
    // X-axis labels
    ctx.textAlign = 'center';
    ctx.fillText(min.toFixed(1), 30, height - 15);
    ctx.fillText(((min + max) / 2).toFixed(1), width / 2, height - 15);
    ctx.fillText(max.toFixed(1), width - 10, height - 15);
    
    // Y-axis labels
    ctx.textAlign = 'right';
    ctx.fillText('0', 25, height - 30);
    ctx.fillText(Math.round(maxBinCount / 2).toString(), 25, height - 30 - (height - 40) / 2);
    ctx.fillText(maxBinCount.toString(), 25, 15);
  };

  // Draw statistics on a histogram
  const drawStatistics = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    stats: any
  ) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.font = '9px Arial';
    ctx.textAlign = 'left';
    
    const statText = `n=${stats.size}, μ=${stats.mean}, σ=${stats.sd}`;
    ctx.fillText(statText, 35, 20);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Central Limit Theorem Sampler</h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Explore the Central Limit Theorem by sampling from various distributions and observing how sample statistics behave as sample size increases.
          </p>
        </div>
        
        <Tabs defaultValue="sampler" className="w-full">
          <TabsList className="grid grid-cols-2 w-[400px] mx-auto">
            <TabsTrigger value="sampler">Sampler</TabsTrigger>
            <TabsTrigger value="about">About CLT</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sampler" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Distribution Settings</CardTitle>
                <CardDescription>Select a distribution and its parameters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="distribution">Distribution</Label>
                      <Select 
                        value={selectedDistribution} 
                        onValueChange={(value) => {
                          setSelectedDistribution(value);
                          toast({
                            title: "Distribution changed",
                            description: `Changed to ${distributions[value].name}`,
                          });
                        }}
                      >
                        <SelectTrigger id="distribution">
                          <SelectValue placeholder="Select a distribution" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(distributions).map((key) => (
                            <SelectItem key={key} value={key}>
                              {distributions[key].name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="sample-size">Sample Size</Label>
                      <div className="flex items-center space-x-2">
                        <Slider 
                          id="sample-size"
                          min={1} 
                          max={100} 
                          step={1}
                          value={[sampleSize]}
                          onValueChange={(value) => setSampleSize(value[0])}
                          className="flex-1"
                        />
                        <span className="w-12 text-center">{sampleSize}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="speed">Animation Speed</Label>
                      <div className="flex items-center space-x-2">
                        <Slider 
                          id="speed"
                          min={1} 
                          max={20} 
                          step={1} 
                          value={[animationSpeed]}
                          onValueChange={(value) => setAnimationSpeed(value[0])}
                          className="flex-1"
                        />
                        <span className="w-12 text-center">{animationSpeed}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {selectedDistribution === "normal" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="mean">Mean (μ)</Label>
                          <div className="flex items-center space-x-2">
                            <Slider 
                              id="mean"
                              min={-10} 
                              max={10} 
                              step={0.1} 
                              value={[distributionParams.mean]}
                              onValueChange={(value) => setDistributionParams({...distributionParams, mean: value[0]})}
                              className="flex-1"
                            />
                            <span className="w-12 text-center">{distributionParams.mean.toFixed(1)}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="sd">Standard Deviation (σ)</Label>
                          <div className="flex items-center space-x-2">
                            <Slider 
                              id="sd"
                              min={0.1} 
                              max={5} 
                              step={0.1} 
                              value={[distributionParams.sd]}
                              onValueChange={(value) => setDistributionParams({...distributionParams, sd: value[0]})}
                              className="flex-1"
                            />
                            <span className="w-12 text-center">{distributionParams.sd.toFixed(1)}</span>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {selectedDistribution === "uniform" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="a">Lower Bound (a)</Label>
                          <div className="flex items-center space-x-2">
                            <Slider 
                              id="a"
                              min={-10} 
                              max={10} 
                              step={0.1} 
                              value={[distributionParams.a]}
                              onValueChange={(value) => setDistributionParams({...distributionParams, a: value[0]})}
                              className="flex-1"
                            />
                            <span className="w-12 text-center">{distributionParams.a.toFixed(1)}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="b">Upper Bound (b)</Label>
                          <div className="flex items-center space-x-2">
                            <Slider 
                              id="b"
                              min={-10} 
                              max={10} 
                              step={0.1} 
                              value={[distributionParams.b]}
                              onValueChange={(value) => {
                                if (value[0] > distributionParams.a) {
                                  setDistributionParams({...distributionParams, b: value[0]})
                                } else {
                                  toast({
                                    variant: "destructive",
                                    title: "Invalid input",
                                    description: "Upper bound must be greater than lower bound",
                                  });
                                }
                              }}
                              className="flex-1"
                            />
                            <span className="w-12 text-center">{distributionParams.b.toFixed(1)}</span>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {selectedDistribution === "exponential" && (
                      <div className="space-y-2">
                        <Label htmlFor="lambda">Rate Parameter (λ)</Label>
                        <div className="flex items-center space-x-2">
                          <Slider 
                            id="lambda"
                            min={0.1} 
                            max={5} 
                            step={0.1} 
                            value={[distributionParams.lambda]}
                            onValueChange={(value) => setDistributionParams({...distributionParams, lambda: value[0]})}
                            className="flex-1"
                          />
                          <span className="w-12 text-center">{distributionParams.lambda.toFixed(1)}</span>
                        </div>
                      </div>
                    )}
                    
                    {selectedDistribution === "bernoulli" && (
                      <div className="space-y-2">
                        <Label htmlFor="p">Success Probability (p)</Label>
                        <div className="flex items-center space-x-2">
                          <Slider 
                            id="p"
                            min={0} 
                            max={1} 
                            step={0.01} 
                            value={[distributionParams.p]}
                            onValueChange={(value) => setDistributionParams({...distributionParams, p: value[0]})}
                            className="flex-1"
                          />
                          <span className="w-12 text-center">{distributionParams.p.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="step-animation">Show Step Animation</Label>
                        <Switch 
                          id="step-animation" 
                          checked={showStepAnimation}
                          onCheckedChange={setShowStepAnimation}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current samples: {numberOfSamples}</p>
                </div>
                <div className="space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={clearSamples}
                  >
                    Clear Samples
                  </Button>
                  <Button 
                    variant={isAnimating ? "destructive" : "default"}
                    onClick={isAnimating ? stopAnimation : startAnimation}
                  >
                    {isAnimating ? "Stop Sampling" : "Start Sampling"}
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={() => takeSample(true)}
                    disabled={isAnimating}
                  >
                    Take Single Sample
                  </Button>
                </div>
              </CardFooter>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left side: Population and Sample */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex justify-between">
                      <span>Population Distribution</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <canvas 
                      ref={canvasRefs.population} 
                      width={500} 
                      height={200} 
                      className="w-full h-auto bg-muted/20 rounded-md"
                    ></canvas>
                  </CardContent>
                  <CardFooter>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Size</TableHead>
                          <TableHead>Mean</TableHead>
                          <TableHead>Median</TableHead>
                          <TableHead>SD</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>{populationStats.size}</TableCell>
                          <TableCell>{populationStats.mean}</TableCell>
                          <TableCell>{populationStats.median}</TableCell>
                          <TableCell>{populationStats.sd}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Current Sample (n={sampleSize})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <canvas 
                      ref={canvasRefs.currentSample} 
                      width={500} 
                      height={200} 
                      className="w-full h-auto bg-muted/20 rounded-md"
                    ></canvas>
                  </CardContent>
                  <CardFooter>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Size</TableHead>
                          <TableHead>Mean</TableHead>
                          <TableHead>Median</TableHead>
                          <TableHead>SD</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>{sampleStats.size}</TableCell>
                          <TableCell>{sampleStats.mean}</TableCell>
                          <TableCell>{sampleStats.median}</TableCell>
                          <TableCell>{sampleStats.sd}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardFooter>
                </Card>
              </div>
              
              {/* Right side: Sampling Distributions */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex justify-between">
                      <div className="flex items-center space-x-2">
                        <Select 
                          value={statistic1} 
                          onValueChange={setStatistic1}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue placeholder="Statistic 1" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mean">Mean</SelectItem>
                            <SelectItem value="median">Median</SelectItem>
                            <SelectItem value="variance">Variance</SelectItem>
                            <SelectItem value="sd">Std. Deviation</SelectItem>
                            <SelectItem value="min">Minimum</SelectItem>
                            <SelectItem value="max">Maximum</SelectItem>
                            <SelectItem value="range">Range</SelectItem>
                            <SelectItem value="skewness">Skewness</SelectItem>
                            <SelectItem value="kurtosis">Kurtosis</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center space-x-1">
                          <Switch 
                            id="fit-normal-1" 
                            checked={fitNormal1}
                            onCheckedChange={setFitNormal1}
                          />
                          <Label htmlFor="fit-normal-1" className="text-xs">Fit Normal</Label>
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <canvas 
                      ref={canvasRefs.samplingDistribution1} 
                      width={500} 
                      height={200} 
                      className="w-full h-auto bg-muted/20 rounded-md"
                    ></canvas>
                  </CardContent>
                  <CardFooter>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Samples</TableHead>
                          <TableHead>Mean</TableHead>
                          <TableHead>Median</TableHead>
                          <TableHead>SD</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>{sampling1Stats.size}</TableCell>
                          <TableCell>{sampling1Stats.mean}</TableCell>
                          <TableCell>{sampling1Stats.median}</TableCell>
                          <TableCell>{sampling1Stats.sd}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex justify-between">
                      <div className="flex items-center space-x-2">
                        <Select 
                          value={statistic2} 
                          onValueChange={setStatistic2}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue placeholder="Statistic 2" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mean">Mean</SelectItem>
                            <SelectItem value="median">Median</SelectItem>
                            <SelectItem value="variance">Variance</SelectItem>
                            <SelectItem value="sd">Std. Deviation</SelectItem>
                            <SelectItem value="min">Minimum</SelectItem>
                            <SelectItem value="max">Maximum</SelectItem>
                            <SelectItem value="range">Range</SelectItem>
                            <SelectItem value="skewness">Skewness</SelectItem>
                            <SelectItem value="kurtosis">Kurtosis</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center space-x-1">
                          <Switch 
                            id="fit-normal-2" 
                            checked={fitNormal2}
                            onCheckedChange={setFitNormal2}
                          />
                          <Label htmlFor="fit-normal-2" className="text-xs">Fit Normal</Label>
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <canvas 
                      ref={canvasRefs.samplingDistribution2} 
                      width={500} 
                      height={200} 
                      className="w-full h-auto bg-muted/20 rounded-md"
                    ></canvas>
                  </CardContent>
                  <CardFooter>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Samples</TableHead>
                          <TableHead>Mean</TableHead>
                          <TableHead>Median</TableHead>
                          <TableHead>SD</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>{sampling2Stats.size}</TableCell>
                          <TableCell>{sampling2Stats.mean}</TableCell>
                          <TableCell>{sampling2Stats.median}</TableCell>
                          <TableCell>{sampling2Stats.sd}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>About the Central Limit Theorem</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <h3>What is the Central Limit Theorem?</h3>
                <p>
                  The Central Limit Theorem (CLT) is one of the most important concepts in probability theory and statistics. 
                  It states that when independent random variables are added together, their properly normalized sum tends 
                  toward a normal distribution even if the original variables themselves are not normally distributed.
                </p>
                
                <h3>Key Points of the CLT</h3>
                <ul>
                  <li>
                    <strong>Sample means are approximately normally distributed</strong> for large enough sample sizes, 
                    regardless of the shape of the population distribution.
                  </li>
                  <li>
                    <strong>The mean of the sampling distribution</strong> equals the population mean.
                  </li>
                  <li>
                    <strong>The standard deviation of the sampling distribution</strong> equals the population standard 
                    deviation divided by the square root of the sample size.
                  </li>
                  <li>
                    The approximation improves as the sample size increases.
                  </li>
                </ul>
                
                <h3>How to Use This Sampler</h3>
                <ol>
                  <li>Select a population distribution and set its parameters.</li>
                  <li>Choose a sample size.</li>
                  <li>Take samples either one at a time or automatically.</li>
                  <li>Observe how the sampling distributions of various statistics behave.</li>
                  <li>Toggle the "Fit Normal" switch to see how well a normal distribution approximates the sampling distribution.</li>
                </ol>
                
                <h3>Applications of the CLT</h3>
                <p>
                  The Central Limit Theorem has numerous applications in statistics, quality control, finance, and many other fields:
                </p>
                <ul>
                  <li>It forms the basis for many statistical tests and confidence intervals.</li>
                  <li>It explains why many natural phenomena follow normal distributions.</li>
                  <li>It allows us to make inferences about populations based on samples.</li>
                  <li>It helps quantify uncertainty in measurements and estimates.</li>
                </ul>
                
                <h3>Mathematical Formulation</h3>
                <p>
                  For a random sample X₁, X₂, ..., Xₙ from a population with mean μ and finite variance σ², the standardized sample mean:
                </p>
                <p className="text-center">
                  Z = (X̄ - μ) / (σ/√n)
                </p>
                <p>
                  converges in distribution to a standard normal random variable as n approaches infinity.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CLTSampler;
