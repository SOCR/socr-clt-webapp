
import React from 'react';
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

interface StatisticsTableProps {
  sampleStats?: {
    mean: number;
    sd: number;
    skewness: number;
    kurtosis: number;
    ksStatistic: number;
    klDivergence: number;
  } | null;
  theoreticalStats?: {
    mean: number;
    sd: number;
    skewness: number;
    kurtosis: number;
    ksStatistic: number;
    klDivergence: number;
  } | null;
}

const StatisticsTable: React.FC<StatisticsTableProps> = ({
  sampleStats,
  theoreticalStats
}) => {
  if (!sampleStats) return null;

  return (
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
  );
};

export default StatisticsTable;
