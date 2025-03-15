
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { distributions, ManualDistribution, calculateMean, calculateSD, calculateBins } from '@/lib/distributions';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import DistributionControls from '@/components/DistributionControls';
import { useToast } from "@/components/ui/use-toast";

type DistributionType = keyof typeof distributions;

const CLTSampler = () => {
  // State for distribution parameters
  const [distribution, setDistribution] = useState<DistributionType>('normal');
  const [params, setParams] = useState<Record<string, any>>({});
  
  // State for CLT parameters
  const [sampleSize, setSampleSize] = useState(30);
  const [numSamples, setNumSamples] = useState(1000);
  
  // State for generated data
  const [populationData, setPopulationData] = useState<number[]>([]);
  const [sampleMeans, setSampleMeans] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Summary statistics
  const [populationStats, setPopulationStats] = useState({ mean: 0, sd: 0 });
  const [sampleStats, setSampleStats] = useState({ mean: 0, sd: 0, theoreticalSd: 0 });
  
  const { toast } = useToast();
  
  // Initialize with default params for selected distribution
  useEffect(() => {
    const currentDist = distributions[distribution];
    const defaultParams: Record<string, any> = {};
    
    if (currentDist.params) {
      Object.entries(currentDist.params).forEach(([key, config]) => {
        defaultParams[key] = config.default;
      });
    }
    
    // Add manual distribution instance if manual is selected
    if (distribution === 'manual') {
      defaultParams.distribution = new ManualDistribution();
    }
    
    setParams(defaultParams);
  }, [distribution]);
  
  // Generate data when parameters change
  useEffect(() => {
    generatePopulationData();
  }, [distribution, params]);
  
  // Prepare data for charts
  const populationChartData = useMemo(() => {
    if (populationData.length === 0) return [];
    
    const bins = calculateBins(populationData);
    return bins.map(bin => ({
      x: bin.midpoint,
      frequency: bin.frequency,
    }));
  }, [populationData]);
  
  const sampleChartData = useMemo(() => {
    if (sampleMeans.length === 0) return [];
    
    const bins = calculateBins(sampleMeans);
    return bins.map(bin => ({
      x: bin.midpoint,
      frequency: bin.frequency,
    }));
  }, [sampleMeans]);
  
  // Generate population data from selected distribution
  const generatePopulationData = () => {
    try {
      // Generate a large dataset from the selected distribution
      const data: number[] = [];
      const distFunction = distributions[distribution];
      
      // Create synthetic dataset
      for (let i = 0; i < 10000; i++) {
        data.push(distFunction.generate(params));
      }
      
      setPopulationData(data);
      
      // Calculate summary statistics
      const mean = calculateMean(data);
      const sd = calculateSD(data);
      setPopulationStats({ mean, sd });
      
    } catch (error) {
      console.error("Error generating population data:", error);
      toast({
        title: "Error generating distribution",
        description: "There was an error with the selected parameters. Please try different values.",
        variant: "destructive"
      });
    }
  };
  
  // Generate sample means using CLT
  const generateSampleMeans = () => {
    if (populationData.length === 0) {
      toast({
        title: "No population data",
        description: "Please generate population data first.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    
    // Use setTimeout to avoid UI freeze
    setTimeout(() => {
      try {
        const means: number[] = [];
        
        // Generate means of samples
        for (let i = 0; i < numSamples; i++) {
          const sample: number[] = [];
          
          // Draw random samples from the distribution
          for (let j = 0; j < sampleSize; j++) {
            const distFunction = distributions[distribution];
            sample.push(distFunction.generate(params));
          }
          
          means.push(calculateMean(sample));
        }
        
        setSampleMeans(means);
        
        // Calculate summary statistics
        const mean = calculateMean(means);
        const sd = calculateSD(means);
        const theoreticalSd = populationStats.sd / Math.sqrt(sampleSize);
        setSampleStats({ mean, sd, theoreticalSd });
        
        toast({
          title: "Sampling complete",
          description: `Generated ${numSamples} sample means with sample size ${sampleSize}.`,
        });
      } catch (error) {
        console.error("Error generating sample means:", error);
        toast({
          title: "Error in sampling",
          description: "There was an error generating the sample means.",
          variant: "destructive"
        });
      } finally {
        setIsGenerating(false);
      }
    }, 50);
  };
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Central Limit Theorem Explorer</h1>
      <p className="text-lg">
        Explore how the Central Limit Theorem works with different probability distributions.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Distribution Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution Settings</CardTitle>
            <CardDescription>
              Choose a distribution and set its parameters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DistributionControls
              distribution={distribution}
              params={params}
              onDistributionChange={setDistribution}
              onParamsChange={setParams}
            />
          </CardContent>
        </Card>
        
        {/* Sampling Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Sampling Controls</CardTitle>
            <CardDescription>
              Configure CLT sampling parameters.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="sampleSize">Sample Size (n)</Label>
              <div className="flex items-center space-x-2">
                <Slider
                  id="sampleSize"
                  min={2}
                  max={100}
                  step={1}
                  value={[sampleSize]}
                  onValueChange={(value) => setSampleSize(value[0])}
                />
                <span className="w-12 text-center">{sampleSize}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="numSamples">Number of Samples</Label>
              <div className="flex items-center space-x-2">
                <Slider
                  id="numSamples"
                  min={100}
                  max={5000}
                  step={100}
                  value={[numSamples]}
                  onValueChange={(value) => setNumSamples(value[0])}
                />
                <span className="w-12 text-center">{numSamples}</span>
              </div>
            </div>
            
            <Button 
              onClick={generateSampleMeans} 
              disabled={isGenerating} 
              className="w-full"
            >
              {isGenerating ? "Generating..." : "Generate Sample Means"}
            </Button>
          </CardContent>
        </Card>
        
        {/* Summary Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Summary Statistics</CardTitle>
            <CardDescription>
              Statistical properties of the distribution and samples.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">Population:</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Mean (μ)</Label>
                  <Input readOnly value={populationStats.mean.toFixed(4)} />
                </div>
                <div>
                  <Label>Std Dev (σ)</Label>
                  <Input readOnly value={populationStats.sd.toFixed(4)} />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold">Sample Means:</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Mean</Label>
                  <Input readOnly value={sampleMeans.length ? sampleStats.mean.toFixed(4) : "N/A"} />
                </div>
                <div>
                  <Label>Std Dev</Label>
                  <Input readOnly value={sampleMeans.length ? sampleStats.sd.toFixed(4) : "N/A"} />
                </div>
              </div>
              <div className="mt-2">
                <Label>Theoretical SD (σ/√n)</Label>
                <Input readOnly value={sampleMeans.length ? sampleStats.theoreticalSd.toFixed(4) : "N/A"} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Data Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Data Visualization</CardTitle>
          <CardDescription>
            Compare the population distribution with the distribution of sample means.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="histogram">
            <TabsList className="mb-4">
              <TabsTrigger value="histogram">Histograms</TabsTrigger>
              <TabsTrigger value="density">Density Curves</TabsTrigger>
            </TabsList>
            
            <TabsContent value="histogram" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Population Distribution</h3>
                  <div className="h-[300px] border p-2 rounded-lg">
                    {populationChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={populationChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="x" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="frequency" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Sample Means Distribution</h3>
                  <div className="h-[300px] border p-2 rounded-lg">
                    {sampleChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sampleChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="x" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="frequency" fill="#f59e0b" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="density" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Population Density</h3>
                  <div className="h-[300px] border p-2 rounded-lg">
                    {populationChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={populationChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="x" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="frequency" stroke="#3b82f6" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Sample Means Density</h3>
                  <div className="h-[300px] border p-2 rounded-lg">
                    {sampleChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sampleChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="x" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="frequency" stroke="#f59e0b" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CLTSampler;
