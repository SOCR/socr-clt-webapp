
import React from 'react';
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { distributions } from '@/lib/distributions';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ManualDistributionDrawer from './ManualDistributionDrawer';
import { ManualDistribution } from '@/lib/distributions';
import { DistributionParam } from '@/lib/distributions/types';

type DistributionType = keyof typeof distributions;

interface DistributionControlsProps {
  distribution: DistributionType;
  params: Record<string, any>;
  onDistributionChange: (dist: DistributionType) => void;
  onParamsChange: (params: Record<string, any>) => void;
}

const DistributionControls: React.FC<DistributionControlsProps> = ({
  distribution,
  params,
  onDistributionChange,
  onParamsChange
}) => {
  const handleParamChange = (key: string, value: any) => {
    onParamsChange({ ...params, [key]: value });
  };

  const handleManualDistributionChange = (manualDist: ManualDistribution) => {
    onParamsChange({ ...params, distribution: manualDist });
  };

  // Get all distribution keys and sort them
  const distKeys = Object.keys(distributions) as DistributionType[];
  
  // Create category groups
  const continuousDists = distKeys.filter(key => distributions[key].category === 'continuous');
  const discreteDists = distKeys.filter(key => distributions[key].category === 'discrete');
  const samplingDists = distKeys.filter(key => distributions[key].category === 'sampling');
  const multivariateDists = distKeys.filter(key => distributions[key].category === 'multivariate');
  
  // Get current distribution parameters if any
  const currentDistParams = distributions[distribution].params || {};
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="distribution">Distribution</Label>
        <Select value={distribution} onValueChange={(value: string) => onDistributionChange(value as DistributionType)}>
          <SelectTrigger id="distribution">
            <SelectValue placeholder="Select a distribution" />
          </SelectTrigger>
          <SelectContent>
            <ScrollArea className="h-80">
              {continuousDists.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Continuous</div>
                  {continuousDists.map((key) => (
                    <SelectItem key={key} value={key}>{distributions[key].name}</SelectItem>
                  ))}
                </>
              )}
              
              {discreteDists.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Discrete</div>
                  {discreteDists.map((key) => (
                    <SelectItem key={key} value={key}>{distributions[key].name}</SelectItem>
                  ))}
                </>
              )}
              
              {samplingDists.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Sampling</div>
                  {samplingDists.map((key) => (
                    <SelectItem key={key} value={key}>{distributions[key].name}</SelectItem>
                  ))}
                </>
              )}
              
              {multivariateDists.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Multivariate</div>
                  {multivariateDists.map((key) => (
                    <SelectItem key={key} value={key}>{distributions[key].name}</SelectItem>
                  ))}
                </>
              )}
            </ScrollArea>
          </SelectContent>
        </Select>
      </div>

      {distribution === 'manual' ? (
        <ManualDistributionDrawer 
          manualDist={params.distribution || new ManualDistribution()}
          onDistributionChange={handleManualDistributionChange}
        />
      ) : (
        <Accordion type="single" collapsible defaultValue="params" className="w-full">
          <AccordionItem value="params">
            <AccordionTrigger>Distribution Settings</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {Object.entries(currentDistParams).map(([key, config]) => {
                  const paramConfig = config as DistributionParam;
                  return (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key}>
                        {paramConfig.name} {paramConfig.description && `(${paramConfig.description})`}
                      </Label>
                      <Input
                        id={key}
                        type="number"
                        value={params[key] !== undefined ? params[key] : paramConfig.default}
                        onChange={(e) => handleParamChange(key, parseFloat(e.target.value))}
                        min={paramConfig.min}
                        max={paramConfig.max}
                        step={paramConfig.step || 0.1}
                      />
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
};

export default DistributionControls;
