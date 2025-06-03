
import React, { useRef, useEffect } from 'react';
import { Label } from "@/components/ui/label";

interface DistributionCanvasProps {
  points: [number, number][];
  width: number;
  height: number;
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: () => void;
}

const DistributionCanvas: React.FC<DistributionCanvasProps> = ({
  points,
  width,
  height,
  onMouseDown,
  onMouseMove,
  onMouseUp
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
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
    
    // Draw grid
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
    
    // Draw distribution curve
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
      
      // Fill area under curve
      ctx.lineTo(scaledPoints[scaledPoints.length - 1][0], 0);
      ctx.lineTo(scaledPoints[0][0], 0);
      ctx.closePath();
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.fill();
    }
    
    ctx.restore();
    
    // Draw labels
    ctx.fillStyle = '#666';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    
    for (let i = -5; i <= 5; i += 1) {
      const x = ((i + 5) / 10) * canvas.width;
      ctx.fillText(i.toString(), x, canvas.height - 2);
    }
    
  }, [points, width, height]);

  return (
    <div className="space-y-2">
      <Label>Draw Your Distribution</Label>
      <div 
        className="border border-gray-300 rounded-md p-2"
        style={{ width: '100%', height: `${height}px` }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          className="cursor-crosshair touch-none"
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Click and drag to draw your probability density function. The area under the curve will be automatically normalized.
      </p>
    </div>
  );
};

export default DistributionCanvas;
