
import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/components/ui/use-toast";
import { ManualDistribution } from "@/lib/distributions";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const ManualDrawing = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [manualDist] = useState<ManualDistribution>(new ManualDistribution());
  const [points, setPoints] = useState<[number, number][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [samples, setSamples] = useState<number[]>([]);
  const [sampleSize, setSampleSize] = useState<number>(100);
  
  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw axes
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 20);
    ctx.lineTo(canvas.width, canvas.height - 20);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(20, canvas.height);
    ctx.stroke();
    
    // Label axes
    ctx.fillText("x", canvas.width - 10, canvas.height - 5);
    ctx.fillText("y", 5, 10);
    
    // Draw existing points
    if (points.length > 1) {
      ctx.beginPath();
      // Scale points to canvas
      const scaleX = (x: number) => 20 + (x * (canvas.width - 40));
      const scaleY = (y: number) => canvas.height - 20 - (y * (canvas.height - 40));
      
      const sortedPoints = [...points].sort((a, b) => a[0] - b[0]);
      
      ctx.moveTo(scaleX(sortedPoints[0][0]), scaleY(sortedPoints[0][1]));
      
      for (let i = 1; i < sortedPoints.length; i++) {
        ctx.lineTo(scaleX(sortedPoints[i][0]), scaleY(sortedPoints[i][1]));
      }
      
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw points
      sortedPoints.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(scaleX(x), scaleY(y), 3, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
      });
    }
  }, [points]);
  
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    addPoint(e);
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    addPoint(e);
  };
  
  const handleMouseUp = () => {
    setIsDrawing(false);
    // Update the manual distribution
    manualDist.clearPoints();
    points.forEach(([x, y]) => {
      manualDist.addPoint(x, y);
    });
    // Normalize after drawing is complete
    manualDist.normalize();
    setPoints(manualDist.getPoints());
  };
  
  const addPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - 20) / (canvas.width - 40);
    const y = (canvas.height - 20 - (e.clientY - rect.top)) / (canvas.height - 40);
    
    // Clamp values to [0,1]
    const clampedX = Math.max(0, Math.min(1, x));
    const clampedY = Math.max(0, Math.min(1, y));
    
    // Check if we need to update an existing point
    const existingPointIndex = points.findIndex(p => Math.abs(p[0] - clampedX) < 0.05);
    
    if (existingPointIndex !== -1) {
      const newPoints = [...points];
      newPoints[existingPointIndex] = [clampedX, clampedY];
      setPoints(newPoints);
    } else {
      setPoints(prev => [...prev, [clampedX, clampedY]]);
    }
  };
  
  const handleClear = () => {
    setPoints([]);
    manualDist.clearPoints();
    setSamples([]);
  };
  
  const handleGenerateSamples = () => {
    if (points.length < 2) {
      toast({
        title: "Not enough points",
        description: "Please draw at least 2 points for sampling",
        variant: "destructive"
      });
      return;
    }
    
    // Generate samples
    const newSamples = Array.from({ length: sampleSize }, () => manualDist.sample());
    setSamples(newSamples);
    
    toast({
      title: "Samples generated",
      description: `Generated ${sampleSize} samples from the custom distribution`
    });
  };
  
  // Convert samples to histogram data for display
  const getHistogramData = () => {
    if (samples.length === 0) return [];
    
    // Create 10 bins
    const min = Math.min(...samples);
    const max = Math.max(...samples);
    const range = max - min;
    const binWidth = range / 10;
    
    const bins = Array(10).fill(0);
    
    samples.forEach(sample => {
      const binIndex = Math.min(9, Math.floor((sample - min) / binWidth));
      bins[binIndex]++;
    });
    
    return bins.map((count, i) => ({
      bin: min + (i * binWidth) + (binWidth / 2),
      count
    }));
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manual Distribution Drawing</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
          >
            Back to Main Page
          </Button>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-4">Draw Your Distribution</h2>
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">Click and drag to draw a probability density function</p>
            <canvas
              ref={canvasRef}
              width={500}
              height={300}
              className="border border-gray-300 w-full bg-white"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>
          <div className="flex gap-4">
            <Button onClick={handleClear} variant="outline">Clear</Button>
          </div>
        </Card>
        
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-4">Sampling Controls</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Sample Size: {sampleSize}</label>
              <Slider
                value={[sampleSize]}
                min={10}
                max={1000}
                step={10}
                onValueChange={(value) => setSampleSize(value[0])}
                className="my-2"
              />
            </div>
            
            <Button onClick={handleGenerateSamples} className="w-full">
              Generate Samples
            </Button>
            
            {samples.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">Sample Histogram</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={getHistogramData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bin" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ManualDrawing;
