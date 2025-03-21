
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
    manualDensity: useRef<HTMLCanvasElement>(null),
  };

  // Distribution and parameters state
  const [selectedDistribution, setSelectedDistribution] = useState("normal");
  const [distributionParams, setDistributionParams] = useState({ 
    mean: 0, 
    sd: 1, 
    p: 0.5, 
    lambda: 1, 
    a: 0, 
    b: 1, 
    location: 0,
    scale: 1,
    df: 5,
    c: 0.5,
    n: 10,
    alpha: 2,
    beta: 5,
    k: 3,
    theta: 2,
    mu: 0,
    sigma: 1,
    nu: 3,
    omega: 1,
    xi: 0,
    rate1: 1,
    rate2: 2,
    shape1: 2,
    shape2: 3,
    min: -3,
    max: 3,
    m: 5,
    s: 1,
    r: 5, // Adding r parameter for negative binomial
    N: 50, // Adding parameters for hypergeometric
    K: 20,
    sigma2: 1 // Adding parameter for other distributions
  });
  
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
  const isAnimatingRef = useRef(false);
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
  
  // Manual density state
  const [isDrawingDensity, setIsDrawingDensity] = useState(false);
  const [manualDensityData, setManualDensityData] = useState<number[]>([]);
  const [manualDensityBins, setManualDensityBins] = useState<number[]>(Array(50).fill(0));
  const isDraggingRef = useRef(false);
  const lastPositionRef = useRef<number | null>(null);

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
    if (selectedDistribution !== "manualDensity") {
      generatePopulationData();
    }
  }, [selectedDistribution, distributionParams]);

  // Set up manual density canvas events
  useEffect(() => {
    if (selectedDistribution === "manualDensity" && canvasRefs.manualDensity.current) {
      const canvas = canvasRefs.manualDensity.current;
      
      const handleMouseDown = (e: MouseEvent) => {
        if (selectedDistribution !== "manualDensity") return;
        isDraggingRef.current = true;
        updateManualDensity(e);
      };
      
      const handleMouseMove = (e: MouseEvent) => {
        if (selectedDistribution !== "manualDensity" || !isDraggingRef.current) return;
        updateManualDensity(e);
      };
      
      const handleMouseUp = () => {
        isDraggingRef.current = false;
        lastPositionRef.current = null;
      };
      
      const handleMouseLeave = () => {
        isDraggingRef.current = false;
        lastPositionRef.current = null;
      };
      
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('mouseleave', handleMouseLeave);
      
      return () => {
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [selectedDistribution]);

  // Draw the histograms whenever data changes
  useEffect(() => {
    drawPopulationHistogram();
    drawCurrentSampleHistogram();
    drawSamplingDistribution1();
    drawSamplingDistribution2();
    if (selectedDistribution === "manualDensity") {
      drawManualDensity();
    }
  }, [populationData, currentSample, samplingData1, samplingData2, fitNormal1, fitNormal2, animationPoint, manualDensityBins]);

  // Clean up animation frames when component unmounts
  useEffect(() => {
    return () => {
      stopAnimation();
    };
  }, []);

  // Handle manual density drawing
  const updateManualDensity = (e: MouseEvent) => {
    if (!canvasRefs.manualDensity.current) return;
    
    const canvas = canvasRefs.manualDensity.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert x position to bin index (considering margins)
    const binIndex = Math.floor((x - 30) / ((canvas.width - 40) / manualDensityBins.length));
    
    if (binIndex >= 0 && binIndex < manualDensityBins.length) {
      // Convert y position to height value (0 at bottom, 1 at top)
      const height = Math.max(0, Math.min(1, 1 - (y - 10) / (canvas.height - 40)));
      
      // Create a new bins array
      const newBins = [...manualDensityBins];
      
      // If this is part of a drag operation, interpolate between last position and current
      if (isDraggingRef.current && lastPositionRef.current !== null) {
        const lastBin = lastPositionRef.current;
        const minBin = Math.min(lastBin, binIndex);
        const maxBin = Math.max(lastBin, binIndex);
        
        for (let i = minBin; i <= maxBin; i++) {
          // Linear interpolation between last position and current
          const t = (i - minBin) / Math.max(1, maxBin - minBin);
          const lastHeight = newBins[lastBin];
          newBins[i] = lastHeight + t * (height - lastHeight);
        }
      } else {
        // Just set the current bin
        newBins[binIndex] = height;
      }
      
      // Update last position for the next drag event
      lastPositionRef.current = binIndex;
      
      setManualDensityBins(newBins);
      
      // Generate population data from the manual density
      generateManualPopulationData(newBins);
    }
  };

  // Generate population data from manual density bins
  const generateManualPopulationData = (bins: number[]) => {
    const data: number[] = [];
    const totalWeight = bins.reduce((sum, bin) => sum + bin, 0);
    
    if (totalWeight === 0) {
      setPopulationData([]);
      setPopulationStats({ size: 0, mean: 0, median: 0, sd: 0, skewness: 0, kurtosis: 0 });
      return;
    }
    
    // Generate data proportional to bin heights
    for (let i = 0; i < bins.length; i++) {
      const binCenter = -5 + (10 * i / bins.length) + (5 / bins.length);
      const count = Math.round((bins[i] / totalWeight) * 10000);
      
      for (let j = 0; j < count; j++) {
        // Add some small random noise within the bin
        const noise = (Math.random() - 0.5) * (10 / bins.length);
        data.push(binCenter + noise);
      }
    }
    
    setPopulationData(data);
    setPopulationStats(calculateStatistics(data));
  };

  // Draw the manual density editor
  const drawManualDensity = () => {
    if (!canvasRefs.manualDensity.current) return;
    
    const canvas = canvasRefs.manualDensity.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the coordinate frame
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 10);
    ctx.lineTo(30, canvas.height - 30);
    ctx.lineTo(canvas.width - 10, canvas.height - 30);
    ctx.stroke();
    
    // Draw the histogram bars
    const barWidth = Math.max((canvas.width - 40) / manualDensityBins.length, 1);
    
    ctx.fillStyle = 'rgb(59, 130, 246)';
    for (let i = 0; i < manualDensityBins.length; i++) {
      const barHeight = manualDensityBins[i] * (canvas.height - 40);
      ctx.fillRect(
        30 + i * barWidth,
        canvas.height - 30 - barHeight,
        barWidth - 1,
        barHeight
      );
    }
    
    // Draw axes labels
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    
    // X-axis labels
    ctx.textAlign = 'center';
    ctx.fillText('-5', 30, canvas.height - 15);
    ctx.fillText('0', canvas.width / 2, canvas.height - 15);
    ctx.fillText('5', canvas.width - 10, canvas.height - 15);
    
    // Instructions
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Click and drag to draw your custom probability density', canvas.width / 2, 25);
  };

  // Generate the population data based on the selected distribution
  const generatePopulationData = () => {
    if (selectedDistribution === "manualDensity") return;
    
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
    
    // Handle division by zero for skewness and kurtosis
    let skewness = 0;
    let kurtosis = 0;
    
    if (sd > 0) {
      // Skewness
      skewness = sumCubedDiff / (size * Math.pow(sd, 3));
      
      // Kurtosis (excess kurtosis = kurtosis - 3)
      kurtosis = sumQuarticDiff / (size * Math.pow(sd, 4)) - 3;
    }
    
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

  // Reset the entire application to defaults
  const resetApplication = () => {
    stopAnimation();
    setSelectedDistribution("normal");
    setDistributionParams({ 
      mean: 0, 
      sd: 1, 
      p: 0.5, 
      lambda: 1, 
      a: 0, 
      b: 1, 
      location: 0,
      scale: 1,
      df: 5,
      c: 0.5,
      n: 10,
      alpha: 2,
      beta: 5,
      k: 3,
      theta: 2,
      mu: 0,
      sigma: 1,
      nu: 3,
      omega: 1,
      xi: 0,
      rate1: 1,
      rate2: 2,
      shape1: 2,
      shape2: 3,
      min: -3,
      max: 3,
      m: 5,
      s: 1,
      r: 5,
      N: 50,
      K: 20,
      sigma2: 1
    });
    setSampleSize(5);
    setManualDensityBins(Array(50).fill(0));
    resetSamplingDistributions();
    
    toast({
      title: "Application Reset",
      description: "All settings and data have been reset to default values.",
    });
    
    // Force a regeneration of the population data
    setTimeout(() => generatePopulationData(), 10);
  };

  // Take a single sample with animation
  const takeSample = (enableAnimation = true) => {
    if (sampleStepAnimationRef.current !== null) {
      cancelAnimationFrame(sampleStepAnimationRef.current);
      sampleStepAnimationRef.current = null;
    }
    
    // Check if there's any population data to sample from
    if (populationData.length === 0) {
      toast({
        variant: "destructive",
        title: "No population data",
        description: "Please select a distribution or draw a custom density first.",
      });
      return;
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
    isAnimatingRef.current = true;
    
    const animate = () => {
      // Only continue if we're still in animation mode
      if (!isAnimatingRef.current) return;
      
      // Don't start the next sample until the current one is complete
      if (sampleStepAnimationRef.current === null) {
        // For continuous sampling, disable the step-by-step animation
        takeSample(false);
        
        if (numberOfSamples >= maxSamples) {
          stopAnimation();
          return;
        }
        
        animationRef.current = requestAnimationFrame(() => {
          setTimeout(animate, 1000 / animationSpeed);
        });
      } else {
        // Wait a bit and check again
        animationRef.current = requestAnimationFrame(() => {
          setTimeout(animate, 100);
        });
      }
    };
    
    animate();
  };

  // Stop animation
  const stopAnimation = () => {
    // Set animation flags to false first to prevent new animations from being scheduled
    setIsAnimating(false);
    isAnimatingRef.current = false;
    
    // Cancel any pending animation frames
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (sampleStepAnimationRef.current !== null) {
      cancelAnimationFrame(sampleStepAnimationRef.current);
      sampleStepAnimationRef.current = null;
    }
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
    
    // Create bins - Increased number of bins for better resolution
    const binCount = Math.min(Math.ceil(Math.sqrt(data.length)) * 2, 50);
    const binWidth = (adjustedMax - adjustedMin) / binCount;
    const bins = new Array(binCount).fill(0);
    
    // Count values in each bin
    for (const value of data) {
      const binIndex = Math.min(Math.floor((value - adjustedMin) / binWidth), binCount - 1);
      if (binIndex >= 0) {
        bins[binIndex]++;
      }
    }
    
    // Calculate proportions instead of counts
    const binProportions = bins.map(count => count / data.length / binWidth);
    
    // Find the maximum bin proportion for scaling
    const maxBinProportion = Math.max(...binProportions);
    
    // Calculate the normal curve values if fitting
    let maxNormalValue = 0;
    if (fitNormal && stats.sd > 0) {
      const step = (adjustedMax - adjustedMin) / 100;
      for (let x = adjustedMin; x <= adjustedMax; x += step) {
        const normalValue = (1 / (stats.sd * Math.sqrt(2 * Math.PI))) * 
                            Math.exp(-0.5 * Math.pow((x - stats.mean) / stats.sd, 2));
        maxNormalValue = Math.max(maxNormalValue, normalValue);
      }
    }
    
    // Use the maximum of histogram and normal curve for scaling
    const maxValue = Math.max(maxBinProportion, maxNormalValue);
    
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
      const barHeight = (binProportions[i] / maxValue) * (height - 40);
      ctx.fillRect(
        30 + i * barWidth,
        height - 30 - barHeight,
        barWidth - 1,
        barHeight
      );
    }
    
    // Draw a normal curve if requested
    if (fitNormal && data.length > 1) {
      drawNormalCurve(ctx, width, height, stats.mean, stats.sd, adjustedMin, adjustedMax, maxValue);
    }
    
    // Draw the axes labels
    drawAxesLabels(ctx, width, height, adjustedMin, adjustedMax, maxValue);
    
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
    maxValue: number
  ) => {
    if (sd === 0) return;
    
    // Use black color with increased line width for better visibility
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    const step = (max - min) / 100;
    let firstPoint = true;
    
    for (let x = min; x <= max; x += step) {
      // Calculate normal PDF for this x value
      const normalValue = (1 / (sd * Math.sqrt(2 * Math.PI))) * 
                          Math.exp(-0.5 * Math.pow((x - mean) / sd, 2));
      
      // Scale to fit canvas based on the max value
      const scaledValue = normalValue / maxValue * (height - 40);
      
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
    maxValue: number
  ) => {
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    
    // X-axis labels
    ctx.textAlign = 'center';
    ctx.fillText(min.toFixed(1), 30, height - 15);
    ctx.fillText(((min + max) / 2).toFixed(1), width / 2, height - 15);
    ctx.fillText(max.toFixed(1), width - 10, height - 15);
    
    // Y-axis labels (now using proportions)
    ctx.textAlign = 'right';
    ctx.fillText('0', 25, height - 30);
    ctx.fillText((maxValue / 2).toFixed(3), 25, height - 30 - (height - 40) / 2);
    ctx.fillText(maxValue.toFixed(3), 25, 15);
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

  // Render distribution parameter controls based on the selected distribution
  const renderDistributionParams = () => {
    switch (selectedDistribution) {
      case "normal":
        return (
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
        );
        
      case "uniform":
        return (
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
        );
        
      case "exponential":
        return (
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
        );
        
      case "bernoulli":
        return (
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
        );
      
      case "cauchy":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="location">Location Parameter</Label>
              <div className="flex items-center space-x-2">
                <Slider 
                  id="location"
                  min={-10} 
                  max={10} 
                  step={0.1} 
                  value={[distributionParams.location]}
                  onValueChange={(value) => setDistributionParams({...distributionParams, location: value[0]})}
                  className="flex-1"
                />
                <span className="w-12 text-center">{distributionParams.location.toFixed(1)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="scale">Scale Parameter</Label>
              <div className="flex items-center space-x-2">
                <Slider 
                  id="scale"
                  min={0.1} 
                  max={5} 
                  step={0.1} 
                  value={[distributionParams.scale]}
                  onValueChange={(value) => setDistributionParams({...distributionParams, scale: value[0]})}
                  className="flex-1"
                />
                <span className="w-12 text-center">{distributionParams.scale.toFixed(1)}</span>
              </div>
            </div>
          </>
        );
      
      case "triangular":
        return (
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
            
            <div className="space-y-2">
              <Label htmlFor="c">Mode (c)</Label>
              <div className="flex items-center space-x-2">
                <Slider 
                  id="c"
                  min={distributionParams.a} 
                  max={distributionParams.b} 
                  step={0.1} 
                  value={[distributionParams.c]}
                  onValueChange={(value) => {
                    if (value[0] >= distributionParams.a && value[0] <= distributionParams.b) {
                      setDistributionParams({...distributionParams, c: value[0]})
                    }
                  }}
                  className="flex-1"
                />
                <span className="w-12 text-center">{distributionParams.c.toFixed(1)}</span>
              </div>
            </div>
          </>
        );
      
      case "chiSquared":
        return (
          <div className="space-y-2">
            <Label htmlFor="df">Degrees of Freedom</Label>
            <div className="flex items-center space-x-2">
              <Slider 
                id="df"
                min={1} 
                max={20} 
                step={1} 
                value={[distributionParams.df]}
                onValueChange={(value) => setDistributionParams({...distributionParams, df: value[0]})}
                className="flex-1"
              />
              <span className="w-12 text-center">{distributionParams.df}</span>
            </div>
          </div>
        );
      
      case "studentT":
        return (
          <div className="space-y-2">
            <Label htmlFor="df">Degrees of Freedom</Label>
            <div className="flex items-center space-x-2">
              <Slider 
                id="df"
                min={1} 
                max={20} 
                step={1} 
                value={[distributionParams.df]}
                onValueChange={(value) => setDistributionParams({...distributionParams, df: value[0]})}
                className="flex-1"
              />
              <span className="w-12 text-center">{distributionParams.df}</span>
            </div>
          </div>
        );
      
      case "poisson":
        return (
          <div className="space-y-2">
            <Label htmlFor="lambda">Rate Parameter (λ)</Label>
            <div className="flex items-center space-x-2">
              <Slider 
                id="lambda"
                min={0.1} 
                max={10} 
                step={0.1} 
                value={[distributionParams.lambda]}
                onValueChange={(value) => setDistributionParams({...distributionParams, lambda: value[0]})}
                className="flex-1"
              />
              <span className="w-12 text-center">{distributionParams.lambda.toFixed(1)}</span>
            </div>
          </div>
        );
      
      case "binomial":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="n">Number of Trials (n)</Label>
              <div className="flex items-center space-x-2">
                <Slider 
                  id="n"
                  min={1} 
                  max={50} 
                  step={1} 
                  value={[distributionParams.n]}
                  onValueChange={(value) => setDistributionParams({...distributionParams, n: value[0]})}
                  className="flex-1"
                />
                <span className="w-12 text-center">{distributionParams.n}</span>
              </div>
            </div>
            
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
          </>
        );

      case "gamma":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="alpha">Shape (α)</Label>
              <div className="flex items-center space-x-2">
                <Slider 
                  id="alpha"
                  min={0.1} 
                  max={10} 
                  step={0.1} 
                  value={[distributionParams.alpha]}
                  onValueChange={(value) => setDistributionParams({...distributionParams, alpha: value[0]})}
                  className="flex-1"
                />
                <span className="w-12 text-center">{distributionParams.alpha.toFixed(1)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="beta">Rate (β)</Label>
              <div className="flex items-center space-x-2">
                <Slider 
                  id="beta"
                  min={0.1} 
                  max={10} 
                  step={0.1} 
                  value={[distributionParams.beta]}
                  onValueChange={(value) => setDistributionParams({...distributionParams, beta: value[0]})}
                  className="flex-1"
                />
                <span className="w-12 text-center">{distributionParams.beta.toFixed(1)}</span>
              </div>
            </div>
          </>
        );

      case "weibull":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="k">Shape (k)</Label>
              <div className="flex items-center space-x-2">
                <Slider 
                  id="k"
                  min={0.1} 
                  max={10} 
                  step={0.1} 
                  value={[distributionParams.k]}
                  onValueChange={(value) => setDistributionParams({...distributionParams, k: value[0]})}
                  className="flex-1"
                />
                <span className="w-12 text-center">{distributionParams.k.toFixed(1)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lambda">Scale (λ)</Label>
              <div className="flex items-center space-x-2">
                <Slider 
                  id="lambda"
                  min={0.1} 
                  max={10} 
                  step={0.1} 
                  value={[distributionParams.lambda]}
                  onValueChange={(value) => setDistributionParams({...distributionParams, lambda: value[0]})}
                  className="flex-1"
                />
                <span className="w-12 text-center">{distributionParams.lambda.toFixed(1)}</span>
              </div>
            </div>
          </>
        );

      case "beta":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="alpha">α Parameter</Label>
              <div className="flex items-center space-x-2">
                <Slider 
                  id="alpha"
                  min={0.1} 
                  max={10} 
                  step={0.1} 
                  value={[distributionParams.alpha]}
                  onValueChange={(value) => setDistributionParams({...distributionParams, alpha: value[0]})}
                  className="flex-1"
                />
                <span className="w-12 text-center">{distributionParams.alpha.toFixed(1)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="beta">β Parameter</Label>
              <div className="flex items-center space-x-2">
                <Slider 
                  id="beta"
                  min={0.1} 
                  max={10} 
                  step={0.1} 
                  value={[distributionParams.beta]}
                  onValueChange={(value) => setDistributionParams({...distributionParams, beta: value[0]})}
                  className="flex-1"
                />
                <span className="w-12 text-center">{distributionParams.beta.toFixed(1)}</span>
              </div>
            </div>
          </>
        );

      case "logNormal":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="mu">μ Parameter</Label>
              <div className="flex items-center space-x-2">
                <Slider 
                  id="mu"
                  min={-3} 
                  max={3} 
                  step={0.1} 
                  value={[distributionParams.mu]}
                  onValueChange={(value) => setDistributionParams({...distributionParams, mu: value[0]})}
                  className="flex-1"
                />
                <span className="w-12 text-center">{distributionParams.mu.toFixed(1)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sigma">σ Parameter</Label>
              <div className="flex items-center space-x-2">
                <Slider 
                  id="sigma"
                  min={0.1} 
                  max={3} 
                  step={0.1} 
                  value={[distributionParams.sigma]}
                  onValueChange={(value) => setDistributionParams({...distributionParams, sigma: value[0]})}
                  className="flex-1"
                />
                <span className="w-12 text-center">{distributionParams.sigma.toFixed(1)}</span>
              </div>
            </div>
          </>
        );

      case "pareto":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="alpha">Shape (α)</Label>
              <div className="flex items-center space-x-2">
                <Slider 
                  id="alpha"
                  min={0.1} 
                  max={10} 
                  step={0.1} 
                  value={[distributionParams.alpha]}
                  onValueChange={(value) => setDistributionParams({...distributionParams, alpha: value[0]})}
                  className="flex-1"
                />
                <span className="w-12 text-center">{distributionParams.alpha.toFixed(1)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="m">Scale (minimum)</Label>
              <div className="flex items-center space-x-2">
                <Slider 
                  id="m"
                  min={0.1} 
                  max={10} 
                  step={0.1} 
                  value={[distributionParams.m]}
                  onValueChange={(value) => setDistributionParams({...distributionParams, m: value[0]})}
                  className="flex-1"
                />
                <span className="w-12 text-center">{distributionParams.m.toFixed(1)}</span>
              </div>
            </div>
          </>
        );

      case "laplace":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="mu">Location (μ)</Label>
              <div className="flex items-center space-x-2">
                <Slider 
                  id="mu"
                  min={-10} 
                  max={10} 
                  step={0.1} 
                  value={[distributionParams.mu]}
                  onValueChange={(value) => setDistributionParams({...distributionParams, mu: value[0]})}
                  className="flex-1"
                />
                <span className="w-12 text-center">{distributionParams.mu.toFixed(1)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="b">Scale (b)</Label>
              <div className="flex items-center space-x-2">
                <Slider 
                  id="b"
                  min={0.1} 
                  max={5} 
                  step={0.1} 
                  value={[distributionParams.b]}
                  onValueChange={(value) => setDistributionParams({...distributionParams, b: value[0]})}
                  className="flex-1"
                />
                <span className="w-12 text-center">{distributionParams.b.toFixed(1)}</span>
              </div>
            </div>
          </>
        );

      case "geometric":
        return (
          <div className="space-y-2">
            <Label htmlFor="p">Success Probability (p)</Label>
            <div className="flex items-center space-x-2">
              <Slider 
                id="p"
                min={0.01} 
                max={1} 
                step={0.01} 
                value={[distributionParams.p]}
                onValueChange={(value) => setDistributionParams({...distributionParams, p: value[0]})}
                className="flex-1"
              />
              <span className="w-12 text-center">{distributionParams.p.toFixed(2)}</span>
            </div>
          </div>
        );

      case "logistic":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="mu">Location (μ)</Label>
              <div className="flex items-center space-x-2">
                <Slider 
                  id="mu"
                  min={-10} 
                  max={10} 
                  step={0.1} 
                  value={[distributionParams.mu]}
                  onValueChange={(value) => setDistributionParams({...distributionParams, mu: value[0]})}
                  className="flex-1"
                />
                <span className="w-12 text-center">{distributionParams.mu.toFixed(1)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="s">Scale (s)</Label>
              <div className="flex items-center space-x-2">
                <Slider 
                  id="s"
                  min={0.1} 
                  max={5} 
                  step={0.1} 
                  value={[distributionParams.s]}
                  onValueChange={(value) => setDistributionParams({...distributionParams, s: value[0]})}
                  className="flex-1"
                />
                <span className="w-12 text-center">{distributionParams.s.toFixed(1)}</span>
              </div>
            </div>
          </>
        );

      case "negativeBinomial":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="r">Number of Successes (r)</Label>
              <div className="flex items-center space-x-2">
                <Slider 
                  id="r"
                  min={1} 
                  max={20} 
                  step={1} 
                  value={[distributionParams.r]}
                  onValueChange={(value) => setDistributionParams({...distributionParams, r: value[0]})}
                  className="flex-1"
                />
                <span className="w-12 text-center">{distributionParams.r}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="p">Success Probability (p)</Label>
              <div className="flex items-center space-x-2">
                <Slider 
                  id="p"
                  min={0.01} 
                  max={1} 
                  step={0.01} 
                  value={[distributionParams.p]}
                  onValueChange={(value) => setDistributionParams({...distributionParams, p: value[0]})}
                  className="flex-1"
                />
                <span className="w-12 text-center">{distributionParams.p.toFixed(2)}</span>
              </div>
            </div>
          </>
        );

      case "hypergeometric":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="N">Population Size (N)</Label>
              <div className="flex items-center space-x-2">
                <Slider 
                  id="N"
                  min={10} 
                  max={100} 
                  step={1} 
                  value={[distributionParams.N]}
                  onValueChange={(value) => setDistributionParams({...distributionParams, N: value[0]})}
                  className="flex-1"
                />
                <span className="w-12 text-center">{distributionParams.N}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="K">Number of Success States (K)</Label>
              <div className="flex items-center space-x-2">
                <Slider 
                  id="K"
                  min={1} 
                  max={distributionParams.N} 
                  step={1} 
                  value={[distributionParams.K]}
                  onValueChange={(value) => setDistributionParams({...distributionParams, K: value[0]})}
                  className="flex-1"
                />
                <span className="w-12 text-center">{distributionParams.K}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="n">Sample Size (n)</Label>
              <div className="flex items-center space-x-2">
                <Slider 
                  id="n"
                  min={1} 
                  max={distributionParams.N} 
                  step={1} 
                  value={[distributionParams.n]}
                  onValueChange={(value) => setDistributionParams({...distributionParams, n: value[0]})}
                  className="flex-1"
                />
                <span className="w-12 text-center">{distributionParams.n}</span>
              </div>
            </div>
          </>
        );

      case "rayleigh":
        return (
          <div className="space-y-2">
            <Label htmlFor="sigma">Scale Parameter (σ)</Label>
            <div className="flex items-center space-x-2">
              <Slider 
                id="sigma"
                min={0.1} 
                max={5} 
                step={0.1} 
                value={[distributionParams.sigma]}
                onValueChange={(value) => setDistributionParams({...distributionParams, sigma: value[0]})}
                className="flex-1"
              />
              <span className="w-12 text-center">{distributionParams.sigma.toFixed(1)}</span>
            </div>
          </div>
        );

      case "erlang":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="k">Shape Parameter (k)</Label>
              <div className="flex items-center space-x-2">
                <Slider 
                  id="k"
                  min={1} 
                  max={20} 
                  step={1} 
                  value={[distributionParams.k]}
                  onValueChange={(value) => setDistributionParams({...distributionParams, k: value[0]})}
                  className="flex-1"
                />
                <span className="w-12 text-center">{distributionParams.k}</span>
              </div>
            </div>
            
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
          </>
        );

      case "maxwellBoltzmann":
        return (
          <div className="space-y-2">
            <Label htmlFor="a">Scale Parameter (a)</Label>
            <div className="flex items-center space-x-2">
              <Slider 
                id="a"
                min={0.1} 
                max={5} 
                step={0.1} 
                value={[distributionParams.a]}
                onValueChange={(value) => setDistributionParams({...distributionParams, a: value[0]})}
                className="flex-1"
              />
              <span className="w-12 text-center">{distributionParams.a.toFixed(1)}</span>
            </div>
          </div>
        );

      case "manualDensity":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Use the canvas below to draw your custom probability density by clicking and dragging.
            </p>
            <canvas
              ref={canvasRefs.manualDensity}
              width={500}
              height={200}
              className="w-full h-auto bg-muted/20 rounded-md border border-dashed border-gray-300"
            ></canvas>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setManualDensityBins(Array(50).fill(0));
                setPopulationData([]);
                setPopulationStats({ size: 0, mean: 0, median: 0, sd: 0, skewness: 0, kurtosis: 0 });
              }}
            >
              Clear Drawing
            </Button>
          </div>
        );
        
      default:
        return null;
    }
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
                            description: `Changed to ${value === 'manualDensity' ? 'Manual Density' : distributions[value].name}`,
                          });
                        }}
                      >
                        <SelectTrigger id="distribution">
                          <SelectValue placeholder="Select a distribution" />
                        </SelectTrigger>
                        <SelectContent className="max-h-80">
                          <SelectItem value="manualDensity">Manual Density</SelectItem>
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
                    {renderDistributionParams()}
                    
                    {selectedDistribution !== "manualDensity" && (
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
                    )}
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
                    onClick={resetApplication}
                  >
                    Reset
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
                <CardDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <a href="https://socr.umich.edu/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">SOCR</a>
                    <span>•</span>
                    <a href="https://doi.org/10.1080/10691898.2008.11889560" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">SOCR CLT Paper</a>
                    <span>•</span>
                    <a href="https://wiki.socr.umich.edu/index.php/SOCR_EduMaterials_Activities_GeneralCentralLimitTheorem" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">SOCR CLT learning activity</a>
                    <span>•</span>
                    <a href="http://socr.ucla.edu/htmls/SOCR_Experiments.html" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Earlier SOCR CLT Java applet</a>
                    <span>•</span>
                    <a href="https://github.com/SOCR/SOCR-Java/blob/master/src/edu/ucla/stat/SOCR/experiments/SamplingDistributionExperiment.java" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Java source code</a>
                    <span>•</span>
                    <a href="https://lovable.dev/projects/ce3b1264-08b8-43b0-990d-5f763b7177f1" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Lovable AI Engineer Project</a>
                    <span>•</span>
                    <a href="https://socr-clt-webapp.lovable.app/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">SOCR CLT Webapp deployment</a>
                  </div>
                </CardDescription>
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
