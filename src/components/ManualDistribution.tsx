
import React, { useRef, useEffect, useState } from 'react';

interface ManualDistributionProps {
  bins: number[];
  onChange: (bins: number[]) => void;
  height: number;
  width: number;
}

const ManualDistribution: React.FC<ManualDistributionProps> = ({ 
  bins, 
  onChange, 
  height = 200, 
  width = 400 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [localBins, setLocalBins] = useState<number[]>(bins || Array(20).fill(0));

  // Initialize bins if not provided
  useEffect(() => {
    if (!bins || bins.length === 0) {
      setLocalBins(Array(20).fill(0));
      onChange(Array(20).fill(0));
    } else {
      setLocalBins(bins);
    }
  }, [bins, onChange]);

  // Draw the histogram
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);

    // Find max value for scaling
    const maxBinValue = Math.max(...localBins, 1);
    
    // Draw bins
    const binWidth = width / localBins.length;
    
    localBins.forEach((binValue, index) => {
      const binHeight = (binValue / maxBinValue) * height;
      const x = index * binWidth;
      const y = height - binHeight;
      
      ctx.fillStyle = '#4299e1';
      ctx.fillRect(x, y, binWidth - 1, binHeight);
      
      // Draw border
      ctx.strokeStyle = '#2b6cb0';
      ctx.strokeRect(x, y, binWidth - 1, binHeight);
    });
  }, [localBins, width, height]);

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    updateBinFromMouseEvent(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    updateBinFromMouseEvent(e);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    onChange(localBins);
  };

  const handleMouseLeave = () => {
    if (isDrawing) {
      setIsDrawing(false);
      onChange(localBins);
    }
  };

  const updateBinFromMouseEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate which bin was clicked
    const binWidth = width / localBins.length;
    const binIndex = Math.floor(x / binWidth);
    
    if (binIndex >= 0 && binIndex < localBins.length) {
      // Calculate height as inverse of y position (higher y = smaller value)
      const value = Math.max(0, height - y) / height;
      
      // Update the bin value
      const newBins = [...localBins];
      newBins[binIndex] = value;
      setLocalBins(newBins);
    }
  };

  return (
    <div className="manual-distribution">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: 'pointer', border: '1px solid #ddd' }}
      />
      <div className="text-sm text-gray-600 mt-2">
        Click and drag to draw the density histogram
      </div>
    </div>
  );
};

export default ManualDistribution;
