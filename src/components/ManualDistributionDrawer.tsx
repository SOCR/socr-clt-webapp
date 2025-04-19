
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ManualDistribution } from '@/lib/distributions/manual';
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";

interface ManualDistributionDrawerProps {
  distribution: ManualDistribution;
  onDistributionChange: (dist: ManualDistribution) => void;
}

const ManualDistributionDrawer: React.FC<ManualDistributionDrawerProps> = ({ 
  distribution, 
  onDistributionChange 
}) => {
  const [smoothingFactor, setSmoothingFactor] = useState(5);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(600);
  const [canvasHeight, setCanvasHeight] = useState(300);
  const lastPointRef = useRef<[number, number] | null>(null);
  const { toast } = useToast();
  const [points, setPoints] = useState<[number, number][]>(distribution.getPoints());

  // Resize canvas based on container
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
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Draw the current distribution curve
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set coordinate system where (0,0) is bottom-left
    ctx.save();
    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);
    
    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = '#aaa';
    ctx.moveTo(0, 0);
    ctx.lineTo(canvas.width, 0);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, canvas.height);
    ctx.stroke();
    
    // Draw grid lines
    ctx.beginPath();
    ctx.strokeStyle = '#eee';
    ctx.setLineDash([2, 2]);
    
    // Vertical grid lines
    for (let i = 1; i <= 10; i++) {
      const x = (i / 10) * canvas.width;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
    }
    
    // Horizontal grid lines
    for (let i = 1; i <= 5; i++) {
      const y = (i / 5) * canvas.height * 0.8;
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
    }
    
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw curve
    if (points.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      
      // Convert data points to canvas coordinates
      const scaledPoints = points.map(([x, y]) => [
        (x - -5) / 10 * canvas.width, 
        y * (canvas.height * 0.8)
      ]);
      
      ctx.moveTo(scaledPoints[0][0], scaledPoints[0][1]);
      for (let i = 1; i < scaledPoints.length; i++) {
        ctx.lineTo(scaledPoints[i][0], scaledPoints[i][1]);
      }
      
      ctx.stroke();
      
      // Fill area under curve
      ctx.lineTo(scaledPoints[scaledPoints.length - 1][0], 0);
      ctx.lineTo(scaledPoints[0][0], 0);
      ctx.closePath();
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.fill();
    }
    
    ctx.restore();
    
    // Add x-axis labels
    ctx.fillStyle = '#666';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    
    for (let i = -5; i <= 5; i++) {
      const x = ((i + 5) / 10) * canvas.width;
      ctx.fillText(i.toString(), x, canvas.height - 2);
    }
    
  }, [points]);

  // Interpolate between two points
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

  // Handle mouse events for drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvas.width;
    const y = 1 - (e.clientY - rect.top) / canvas.height;
    
    // Convert to distribution space
    const xDist = -5 + x * 10; // Map [0,1] to [-5,5]
    const yDist = Math.max(0, y); // Ensure y is non-negative
    
    // Reset the distribution
    distribution.clearPoints();
    
    // Add first point and update
    distribution.addPoint(xDist, yDist);
    setPoints(distribution.getPoints());
    
    // Save this point for interpolation
    lastPointRef.current = [xDist, yDist];
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPointRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvas.width;
    const y = 1 - (e.clientY - rect.top) / canvas.height;
    
    // Convert to distribution space
    const xDist = -5 + x * 10; // Map [0,1] to [-5,5]
    const yDist = Math.max(0, y); // Ensure y is non-negative
    
    const lastPoint = lastPointRef.current;
    
    // If points are too close, skip
    const distance = Math.sqrt(Math.pow(xDist - lastPoint[0], 2) + Math.pow(yDist - lastPoint[1], 2));
    if (distance < 0.03) return;
    
    // Interpolate between last point and current point
    const interpolated = interpolatePoints(
      lastPoint, 
      [xDist, yDist],
      Math.ceil(distance * smoothingFactor) // More points for smoother curves
    );
    
    // Add interpolated points
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
    
    // Normalize the distribution
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
    lastPointRef.current = null;
    onDistributionChange(distribution);
    
    toast({
      title: "Canvas cleared",
      description: "The drawing has been cleared. Draw a new distribution."
    });
  };

  return (
    <div className="space-y-4">
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
            className="cursor-crosshair"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Click and drag to draw your probability density function. The area under the curve will be automatically normalized.
        </p>
      </div>
      
      <div className="flex space-x-4">
        <Button onClick={clearCanvas} variant="outline" size="sm">Clear Canvas</Button>
      </div>
      
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
    </div>
  );
};

export default ManualDistributionDrawer;
