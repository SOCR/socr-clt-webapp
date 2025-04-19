
import React from "react";
import { Distribution, DistributionParam } from "@/lib/distributions/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ManualDistribution } from "@/lib/distributions/manual";
import ManualDistributionDrawer from "@/components/ManualDistributionDrawer";

interface DistributionControlsProps {
  selectedDistribution: Distribution;
  parameters: Record<string, number>;
  onParameterChange: (name: string, value: number) => void;
  manualDist: ManualDistribution;
  onManualDistChange: (distribution: ManualDistribution) => void;
}

const DistributionControls: React.FC<DistributionControlsProps> = ({
  selectedDistribution,
  parameters,
  onParameterChange,
  manualDist,
  onManualDistChange,
}) => {
  // Convert a numeric value to string for input fields
  const toInputValue = (value: number): string => {
    return String(value);
  };

  // Convert string input back to number for state
  const fromInputValue = (value: string): number => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Check if this is the manual distribution
  if (selectedDistribution.name === "Manual Distribution") {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Manual Distribution</h3>
        <ManualDistributionDrawer
          distribution={manualDist}
          onDistributionChange={onManualDistChange}
        />
      </div>
    );
  }

  // Handle parameter input changes
  const handleInputChange = (paramName: string, value: string) => {
    onParameterChange(paramName, fromInputValue(value));
  };

  // Special cases for specific distributions
  if (selectedDistribution.name === "Normal Distribution") {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mean">Mean (μ)</Label>
          <Input
            id="mean"
            type="number"
            value={toInputValue(parameters.mean || 0)}
            onChange={(e) => handleInputChange("mean", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="standardDeviation">Standard Deviation (σ)</Label>
          <Input
            id="standardDeviation"
            type="number"
            value={toInputValue(parameters.standardDeviation || 1)}
            onChange={(e) => handleInputChange("standardDeviation", e.target.value)}
          />
        </div>
      </div>
    );
  }

  if (selectedDistribution.name === "Uniform Distribution") {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="a">Lower Bound (a)</Label>
          <Input
            id="a"
            type="number"
            value={toInputValue(parameters.a || 0)}
            onChange={(e) => handleInputChange("a", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="b">Upper Bound (b)</Label>
          <Input
            id="b"
            type="number"
            value={toInputValue(parameters.b || 1)}
            onChange={(e) => handleInputChange("b", e.target.value)}
          />
        </div>
      </div>
    );
  }

  if (selectedDistribution.name === "Exponential Distribution") {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="rate">Rate (λ)</Label>
          <Input
            id="rate"
            type="number"
            value={toInputValue(parameters.rate || 1)}
            onChange={(e) => handleInputChange("rate", e.target.value)}
          />
        </div>
      </div>
    );
  }

  // Render controls dynamically based on distribution parameters
  if (selectedDistribution.params) {
    return (
      <div className="space-y-4">
        {Object.entries(selectedDistribution.params).map(([key, param]) => {
          const paramValue = parameters[key] !== undefined 
            ? parameters[key] 
            : (param as DistributionParam).default;
          
          return (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>
                {(param as DistributionParam).name} 
                {(param as DistributionParam).description && (
                  <span className="text-xs text-gray-500 ml-1">
                    ({(param as DistributionParam).description})
                  </span>
                )}
              </Label>
              <Input
                id={key}
                type="number"
                value={toInputValue(paramValue)}
                onChange={(e) => handleInputChange(key, e.target.value)}
                min={(param as DistributionParam).min?.toString()}
                max={(param as DistributionParam).max?.toString()}
                step={(param as DistributionParam).step?.toString()}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="p-4 text-center">
      <p>No parameters available for this distribution.</p>
    </div>
  );
};

export default DistributionControls;
