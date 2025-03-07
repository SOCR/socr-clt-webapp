
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ManualDistribution } from '@/lib/distributions';
import { Link } from 'react-router-dom';

const ManualDrawing: React.FC = () => {
  const [manualDist] = useState<ManualDistribution>(new ManualDistribution());
  const [points, setPoints] = useState<[number, number][]>([]);
  const [samples, setSamples] = useState<number[]>([]);
  const [sampleSize, setSampleSize] = useState(100);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(600);
  const [canvasHeight, setCanvasHeight] = useState(300);

  // Resize canvas based on container
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        if (parent) {
          setCanvasWidth(parent.clientWidth);
          setCanvasHeight(300); // Fixed height
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
    
    // Draw curve
    if (points.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      
      // Convert data points to canvas coordinates
      const scaledPoints = points.map(([x, y]) => [
        (x - -3) / (3 - -3) * canvas.width, 
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
    
    // Draw samples as points
    if (samples.length > 0) {
      ctx.fillStyle = 'rgba(220, 38, 38, 0.7)';
      samples.forEach(sample => {
        const x = (sample - -3) / (3 - -3) * canvas.width;
        ctx.beginPath();
        ctx.arc(x, 10, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    
    ctx.restore();
  }, [points, samples]);

  // Handle mouse/touch events for drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvas.width;
    const y = 1 - (e.clientY - rect.top) / canvas.height;
    
    // Convert to distribution space
    const xDist = -3 + x * 6; // Map [0,1] to [-3,3]
    const yDist = y;
    
    // Add point and update
    manualDist.clearPoints();
    manualDist.addPoint(xDist, yDist);
    setPoints(manualDist.getPoints());
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvas.width;
    const y = 1 - (e.clientY - rect.top) / canvas.height;
    
    // Convert to distribution space
    const xDist = -3 + x * 6; // Map [0,1] to [-3,3]
    const yDist = y;
    
    // Add point and update
    manualDist.addPoint(xDist, yDist);
    setPoints(manualDist.getPoints());
  };
  
  const handleMouseUp = () => {
    setIsDrawing(false);
    manualDist.normalize();
    setPoints(manualDist.getPoints());
  };

  const generateSamples = () => {
    if (points.length < 2) return;
    
    const newSamples = Array.from({ length: sampleSize }, () => manualDist.sample());
    setSamples(newSamples);
  };

  const clearAll = () => {
    manualDist.clearPoints();
    setPoints([]);
    setSamples([]);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Manual Distribution Drawing</h1>
        <Link to="/">
          <Button variant="outline">Return to Simulator</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Draw Your Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="border border-gray-300 rounded-md p-2 mb-4"
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
            
            <div className="flex space-x-4">
              <Button onClick={clearAll} variant="destructive">Clear Canvas</Button>
              <Button onClick={generateSamples} disabled={points.length < 2}>
                Generate Samples
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sampleSize">Sample Size</Label>
                <Input
                  id="sampleSize"
                  type="number"
                  min="1"
                  max="10000"
                  value={sampleSize}
                  onChange={(e) => setSampleSize(parseInt(e.target.value) || 100)}
                />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Instructions:</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Click and drag to draw your probability density function</li>
                  <li>The area under the curve will be automatically normalized</li>
                  <li>Click "Generate Samples" to create random samples</li>
                  <li>Red dots show the distribution of generated samples</li>
                </ul>
              </div>
              
              {samples.length > 0 && (
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">Sample Statistics:</h3>
                  <div className="text-sm">
                    <p>Sample Size: {samples.length}</p>
                    <p>Mean: {samples.reduce((a, b) => a + b, 0) / samples.length}</p>
                    <p>Min: {Math.min(...samples)}</p>
                    <p>Max: {Math.max(...samples)}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManualDrawing;
