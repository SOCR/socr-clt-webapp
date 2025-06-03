
import React, { useRef, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { ManualDistribution } from '@/lib/distributions/manual';

interface SampleHistogramProps {
  samples: number[];
  points: [number, number][];
  distribution: ManualDistribution;
  width: number;
  height: number;
}

const SampleHistogram: React.FC<SampleHistogramProps> = ({
  samples,
  points,
  distribution,
  width,
  height
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (samples.length === 0) return;
    
    const canvas = canvasRef.current;
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
    
    // Draw histogram bars
    for (let i = 0; i < numBins; i++) {
      const barHeight = (maxBinCount > 0) ? (bins[i] / maxBinCount * canvas.height * 0.8) : 0;
      const x = i * barWidth;
      
      ctx.fillStyle = 'rgba(59, 130, 246, 0.6)';
      ctx.fillRect(x, 0, barWidth - 1, barHeight);
      
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
      ctx.strokeRect(x, 0, barWidth - 1, barHeight);
    }
    
    // Draw theoretical PDF
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
    
    // Draw x-axis labels
    ctx.fillStyle = '#666';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    
    for (let i = 0; i <= 5; i++) {
      const value = min + (i / 5) * (max - min);
      const x = (i / 5) * canvas.width;
      ctx.fillText(value.toFixed(1), x, canvas.height - 2);
    }
    
  }, [samples, points, distribution, width, height]);

  return (
    <div className="space-y-2">
      <Label>Sample Histogram</Label>
      <div 
        className="border border-gray-300 rounded-md p-2"
        style={{ width: '100%', height: `${height}px` }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Blue bars: Histogram of samples. Red line: Theoretical PDF from your drawing.
      </p>
    </div>
  );
};

export default SampleHistogram;
