import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ManualDistribution } from '@/lib/distributions/manual';
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";
import DistributionCanvas from './DistributionCanvas';
import SampleHistogram from './SampleHistogram';
import StatisticsTable from './StatisticsTable';
import { 
  calculateMean, 
  calculateVariance, 
  calculateSD, 
  calculateSkewness, 
  calculateKurtosis,
  calculateKSStatistic,
  calculateKLDivergence
} from '@/lib/statistics';

interface ManualDistributionDrawerProps {
  distribution: ManualDistribution;
  onDistributionChange: (dist: ManualDistribution) => void;
}

const ManualDistributionDrawer: React.FC<ManualDistributionDrawerProps> = ({ 
  distribution, 
  onDistributionChange 
}) => {
  const [smoothingFactor, setSmoothingFactor] = useState(5);
  const [canvasWidth, setCanvasWidth] = useState(600);
  const [canvasHeight, setCanvasHeight] = useState(300);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<[number, number][]>(distribution.getPoints());
  const [samples, setSamples] = useState<number[]>([]);
  const [sampleCount, setSampleCount] = useState(500);
  
  const lastPointRef = useRef<[number, number] | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleResize = () => {
      setCanvasWidth(600);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const interpolatePoints = (
    start: [number, number], 
    end: [number, number], 
    steps: number
  ): [number, number][] => {
    const interpolated: [number, number][] = [];
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = start[0] + t * (end[0] - start[0]);
      const y = start[1] + t * (end[1] - start[1]);
      interpolated.push([x, y]);
    }
    
    return interpolated;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvas.width;
    const y = 1 - (e.clientY - rect.top) / canvas.height;
    
    const xDist = -5 + x * 10;
    const yDist = Math.max(0, y);
    
    distribution.clearPoints();
    distribution.addPoint(xDist, yDist);
    setPoints(distribution.getPoints());
    
    lastPointRef.current = [xDist, yDist];
    setSamples([]);
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPointRef.current) return;
    
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvas.width;
    const y = 1 - (e.clientY - rect.top) / canvas.height;
    
    const xDist = -5 + x * 10;
    const yDist = Math.max(0, y);
    
    const lastPoint = lastPointRef.current;
    
    const distance = Math.sqrt(Math.pow(xDist - lastPoint[0], 2) + Math.pow(yDist - lastPoint[1], 2));
    if (distance < 0.03) return;
    
    const interpolated = interpolatePoints(
      lastPoint, 
      [xDist, yDist],
      Math.ceil(distance * smoothingFactor)
    );
    
    for (let i = 1; i < interpolated.length; i++) {
      distribution.addPoint(interpolated[i][0], interpolated[i][1]);
    }
    
    setPoints(distribution.getPoints());
    lastPointRef.current = [xDist, yDist];
  };
  
  const handleMouseUp = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    lastPointRef.current = null;
    
    distribution.normalize();
    setPoints(distribution.getPoints());
    
    if (points.length < 2) {
      toast({
        title: "Drawing incomplete",
        description: "Please draw more points to create a valid distribution.",
        variant: "destructive"
      });
    } else {
      onDistributionChange(distribution);
      generateSamples();
      
      const stats = distribution.getStats();
      toast({
        title: "Distribution updated",
        description: `Mean: ${stats.mean.toFixed(2)}, Variance: ${stats.variance.toFixed(2)}`
      });
    }
  };

  const clearCanvas = () => {
    distribution.clearPoints();
    setPoints([]);
    setSamples([]);
    lastPointRef.current = null;
    onDistributionChange(distribution);
    
    toast({
      title: "Canvas cleared",
      description: "The drawing has been cleared. Draw a new distribution."
    });
  };
  
  const generateSamples = () => {
    if (points.length < 2) {
      toast({
        title: "Distribution not defined",
        description: "Please draw a distribution first",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const newSamples = distribution.generateSamples(sampleCount);
      setSamples(newSamples);
      
      toast({
        title: "Samples generated",
        description: `Generated ${sampleCount} samples from your distribution`
      });
    } catch (error) {
      console.error("Error generating samples:", error);
      toast({
        title: "Error generating samples",
        description: "Failed to generate samples from your distribution",
        variant: "destructive"
      });
    }
  };
  
  const getSampleStats = () => {
    if (samples.length === 0) return null;
    
    try {
      const mean = calculateMean(samples);
      const variance = calculateVariance(samples);
      const sd = calculateSD(samples);
      const skewness = calculateSkewness(samples);
      const kurtosis = calculateKurtosis(samples);
      const ksStatistic = calculateKSStatistic(samples);
      const klDivergence = calculateKLDivergence(samples);
      
      return { mean, variance, sd, skewness, kurtosis, ksStatistic, klDivergence };
    } catch (error) {
      console.error("Error calculating sample statistics:", error);
      return null;
    }
  };
  
  const getTheoreticalStats = () => {
    if (points.length < 2) return null;
    
    try {
      const theoreticalSamples = distribution.generateSamples(5000);
      const mean = calculateMean(theoreticalSamples);
      const variance = calculateVariance(theoreticalSamples);
      const sd = calculateSD(theoreticalSamples);
      const skewness = calculateSkewness(theoreticalSamples);
      const kurtosis = calculateKurtosis(theoreticalSamples);
      const ksStatistic = calculateKSStatistic(theoreticalSamples);
      const klDivergence = calculateKLDivergence(theoreticalSamples);
      
      return { mean, variance, sd, skewness, kurtosis, ksStatistic, klDivergence };
    } catch (error) {
      console.error("Error calculating theoretical statistics:", error);
      return null;
    }
  };
  
  const sampleStats = getSampleStats();
  const theoreticalStats = getTheoreticalStats();

  return (
    <div className="space-y-6">
      <DistributionCanvas
        points={points}
        width={canvasWidth}
        height={canvasHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      
      <div className="flex justify-between space-x-4">
        <Button onClick={clearCanvas} variant="outline" size="sm">Clear Canvas</Button>
        <div className="flex items-center space-x-2">
          <Label htmlFor="sampleCount" className="text-sm">Samples:</Label>
          <Input 
            id="sampleCount"
            type="number"
            value={sampleCount}
            onChange={(e) => setSampleCount(Math.max(10, parseInt(e.target.value) || 100))}
            className="w-20 h-8"
          />
          <Button onClick={generateSamples} size="sm" disabled={points.length < 2}>
            Generate
          </Button>
        </div>
      </div>
      
      {samples.length > 0 && (
        <SampleHistogram
          samples={samples}
          points={points}
          distribution={distribution}
          width={canvasWidth}
          height={canvasHeight}
        />
      )}
      
      <div className="space-y-2">
        <Label htmlFor="smoothing">Smoothing Factor</Label>
        <Slider
          id="smoothing"
          min={1}
          max={20}
          step={1}
          value={[smoothingFactor]}
          onValueChange={(value) => setSmoothingFactor(value[0])}
        />
        <p className="text-xs text-muted-foreground">
          Higher values create smoother curves
        </p>
      </div>
      
      <StatisticsTable 
        sampleStats={sampleStats}
        theoreticalStats={theoreticalStats}
      />
    </div>
  );
};

export default ManualDistributionDrawer;
