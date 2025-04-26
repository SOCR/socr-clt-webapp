import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ManualDistribution } from '@/lib/distributions/manual';
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const histogramCanvasRef = useRef<HTMLCanvasElement>(null);
  const lastPointRef = useRef<[number, number] | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        if (parent) {
          setCanvasWidth(parent.clientWidth);
        }
      }
    };

    handleResize();
    
    const resizeObserver = new ResizeObserver(handleResize);
    if (canvasRef.current?.parentElement) {
      resizeObserver.observe(canvasRef.current.parentElement);
    }
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      if (canvasRef.current?.parentElement) {
        resizeObserver.unobserve(canvasRef.current.parentElement);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);
    
    ctx.beginPath();
    ctx.strokeStyle = '#aaa';
    ctx.moveTo(0, 0);
    ctx.lineTo(canvas.width, 0);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, canvas.height);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.strokeStyle = '#eee';
    ctx.setLineDash([2, 2]);
    
    for (let i = 1; i <= 10; i++) {
      const x = (i / 10) * canvas.width;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
    }
    
    for (let i = 1; i <= 5; i++) {
      const y = (i / 5) * canvas.height * 0.8;
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
    }
    
    ctx.stroke();
    ctx.setLineDash([]);
    
    if (points.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      
      const scaledPoints = points.map(([x, y]) => [
        (x - -5) / 10 * canvas.width, 
        y * (canvas.height * 0.8)
      ]);
      
      ctx.moveTo(scaledPoints[0][0], scaledPoints[0][1]);
      for (let i = 1; i < scaledPoints.length; i++) {
        ctx.lineTo(scaledPoints[i][0], scaledPoints[i][1]);
      }
      
      ctx.stroke();
      
      ctx.lineTo(scaledPoints[scaledPoints.length - 1][0], 0);
      ctx.lineTo(scaledPoints[0][0], 0);
      ctx.closePath();
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.fill();
    }
    
    ctx.restore();
    
    ctx.fillStyle = '#666';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    
    for (let i = -5; i <= 5; i += 1) {
      const x = ((i + 5) / 10) * canvas.width;
      ctx.fillText(i.toString(), x, canvas.height - 2);
    }
    
  }, [points]);

  useEffect(() => {
    if (samples.length === 0) return;
    
    const canvas = histogramCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const min = Math.min(...samples);
    const max = Math.max(...samples);
    const numBins = 30;
    const binWidth = (max - min) / numBins;
    
    const bins = Array(numBins).fill(0);
    samples.forEach(sample => {
      if (sample === max) {
        bins[numBins - 1]++;
      } else {
        const binIndex = Math.floor((sample - min) / binWidth);
        if (binIndex >= 0 && binIndex < numBins) {
          bins[binIndex]++;
        }
      }
    });
    
    const maxBinCount = Math.max(...bins);
    
    ctx.save();
    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);
    
    const barWidth = canvas.width / numBins;
    
    for (let i = 0; i < numBins; i++) {
      const barHeight = (maxBinCount > 0) ? (bins[i] / maxBinCount * canvas.height * 0.8) : 0;
      const x = i * barWidth;
      
      ctx.fillStyle = 'rgba(59, 130, 246, 0.6)';
      ctx.fillRect(x, 0, barWidth - 1, barHeight);
      
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
      ctx.strokeRect(x, 0, barWidth - 1, barHeight);
    }
    
    if (points.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(220, 38, 38, 0.8)';
      ctx.lineWidth = 2;
      
      const pdfPoints = Array.from({ length: 100 }, (_, i) => {
        const x = min + (i / 99) * (max - min);
        const y = distribution.pdf(x);
        return [x, y];
      });
      
      const maxPdf = Math.max(...pdfPoints.map(p => p[1]));
      if (maxPdf > 0) {
        const scaledPoints = pdfPoints.map(([x, y]) => [
          (x - min) / (max - min) * canvas.width,
          y / maxPdf * canvas.height * 0.8
        ]);
        
        ctx.moveTo(scaledPoints[0][0], scaledPoints[0][1]);
        for (let i = 1; i < scaledPoints.length; i++) {
          ctx.lineTo(scaledPoints[i][0], scaledPoints[i][1]);
        }
        
        ctx.stroke();
      }
    }
    
    ctx.restore();
    
    ctx.fillStyle = '#666';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    
    for (let i = 0; i <= 5; i++) {
      const value = min + (i / 5) * (max - min);
      const x = (i / 5) * canvas.width;
      ctx.fillText(value.toFixed(1), x, canvas.height - 2);
    }
    
  }, [samples, points, distribution]);

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
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
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
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
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
      
      return {
        mean,
        variance,
        sd,
        skewness,
        kurtosis,
        ksStatistic,
        klDivergence
      };
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
      
      return {
        mean,
        variance,
        sd,
        skewness,
        kurtosis,
        ksStatistic,
        klDivergence
      };
    } catch (error) {
      console.error("Error calculating theoretical statistics:", error);
      return null;
    }
  };
  
  const sampleStats = getSampleStats();
  const theoreticalStats = getTheoreticalStats();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Draw Your Distribution</Label>
        <div 
          className="border border-gray-300 rounded-md p-2"
          style={{ width: '100%', height: `${canvasHeight}px` }}
        >
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="cursor-crosshair touch-none"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Click and drag to draw your probability density function. The area under the curve will be automatically normalized.
        </p>
      </div>
      
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
        <div className="space-y-2">
          <Label>Sample Histogram</Label>
          <div 
            className="border border-gray-300 rounded-md p-2"
            style={{ width: '100%', height: `${canvasHeight}px` }}
          >
            <canvas
              ref={histogramCanvasRef}
              width={canvasWidth}
              height={canvasHeight}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Blue bars: Histogram of samples. Red line: Theoretical PDF from your drawing.
          </p>
        </div>
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
      
      {sampleStats && (
        <div className="space-y-2">
          <Label>Statistical Analysis</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Sample Statistics</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Statistic</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Mean</TableCell>
                    <TableCell>{sampleStats.mean.toFixed(4)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Standard Deviation</TableCell>
                    <TableCell>{sampleStats.sd.toFixed(4)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Skewness</TableCell>
                    <TableCell>{sampleStats.skewness.toFixed(4)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Kurtosis</TableCell>
                    <TableCell>{sampleStats.kurtosis.toFixed(4)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Kolmogorov-Smirnov</TableCell>
                    <TableCell>{sampleStats.ksStatistic.toFixed(4)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>KL Divergence</TableCell>
                    <TableCell>{sampleStats.klDivergence.toFixed(4)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            
            {theoreticalStats && (
              <div>
                <h4 className="text-sm font-medium mb-2">Theoretical Statistics</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Statistic</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Mean</TableCell>
                      <TableCell>{theoreticalStats.mean.toFixed(4)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Standard Deviation</TableCell>
                      <TableCell>{theoreticalStats.sd.toFixed(4)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Skewness</TableCell>
                      <TableCell>{theoreticalStats.skewness.toFixed(4)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Kurtosis</TableCell>
                      <TableCell>{theoreticalStats.kurtosis.toFixed(4)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Kolmogorov-Smirnov</TableCell>
                      <TableCell>{theoreticalStats.ksStatistic.toFixed(4)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>KL Divergence</TableCell>
                      <TableCell>{theoreticalStats.klDivergence.toFixed(4)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualDistributionDrawer;
