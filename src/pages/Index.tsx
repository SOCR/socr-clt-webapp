import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Play, Pause, RotateCcw, Download, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const distributionOptions = [
  { value: 'normal', label: 'Normal' },
  { value: 'uniform', label: 'Uniform' },
  { value: 'exponential', label: 'Exponential' },
];

const initialSampleSize = 30;
const initialNumSamples = 1000;
const initialAnimationSpeed = 50;

const generateSample = (distribution: string, size: number): number[] => {
  let sample: number[] = [];
  switch (distribution) {
    case 'normal':
      sample = Array.from({ length: size }, () => Math.randomNormal());
      break;
    case 'uniform':
      sample = Array.from({ length: size }, () => Math.random());
      break;
    case 'exponential':
      sample = Array.from({ length: size }, () => Math.randomExponential(1));
      break;
    default:
      sample = Array.from({ length: size }, () => Math.random());
  }
  return sample;
};

// Function to generate a normal distribution random number
function Math.randomNormal() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  num = num / 10.0 + 0.5; // Translate to 0 -> 1
  if (num > 1 || num < 0) return Math.randomNormal() // resample between 0 and 1
  return num
}

// Function to generate an exponential distribution random number
function Math.randomExponential(rate: number) {
  let u = Math.random();
  return -Math.log(u) / rate;
}

const Index = () => {
  const [selectedDistribution, setSelectedDistribution] = useState(distributionOptions[0].value);
  const [currentSampleSize, setCurrentSampleSize] = useState(initialSampleSize);
  const [currentNumSamples, setCurrentNumSamples] = useState(initialNumSamples);
  const [animationSpeed, setAnimationSpeed] = useState(initialAnimationSpeed);
  const [isRunning, setIsRunning] = useState(false);
  const [samples, setSamples] = useState<number[][]>([]);
  const [sampleMeans, setSampleMeans] = useState<number[]>([]);
  const intervalRef = useRef<number | null>(null);
  const navigate = useNavigate();

  const runSimulation = useCallback(async () => {
    if (!isRunning || !selectedDistribution) return;

    try {
      const sampleSize = parseInt(currentSampleSize.toString());
      const numSamples = parseInt(currentNumSamples.toString());
      
      // Use animation speed to control delay between samples
      const delay = Math.max(10, 1100 - animationSpeed * 10); // Convert speed to delay (higher speed = lower delay)
      
      console.log(`Animation speed: ${animationSpeed}, Delay: ${delay}ms`);
      
      const newSamples = [];
      const newSampleMeans = [];
      
      for (let i = 0; i < numSamples; i++) {
        if (!isRunning) break;
        
        const sample = generateSample(selectedDistribution, sampleSize);
        const mean = sample.reduce((sum, val) => sum + val, 0) / sample.length;
        
        newSamples.push(sample);
        newSampleMeans.push(mean);
        
        // Update state with current progress
        setSamples(prev => [...prev, sample]);
        setSampleMeans(prev => [...prev, mean]);
        
        // Apply delay based on animation speed
        if (i < numSamples - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      setIsRunning(false);
      
      toast.success(`Completed ${numSamples} samples of size ${sampleSize}`);
    } catch (error) {
      console.error("Simulation error:", error);
      setIsRunning(false);
      toast.error("Simulation failed");
    }
  }, [isRunning, selectedDistribution, currentSampleSize, currentNumSamples, animationSpeed]);

  useEffect(() => {
    if (isRunning) {
      runSimulation();
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, runSimulation]);

  const toggleSimulation = () => {
    setIsRunning(prev => !prev);
  };

  const resetSimulation = () => {
    setIsRunning(false);
    setSamples([]);
    setSampleMeans([]);
  };

  const downloadData = () => {
    const filename = 'clt_simulation_data.csv';
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Sample,Mean\n";
    samples.forEach((sample, index) => {
      csvContent += `"${sample.join(' ')}",${sampleMeans[index]}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link); // Required for FF

    link.click();
    document.body.removeChild(link);
  };

  const editDrawing = () => {
    navigate("/manual-drawing");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="text-3xl font-bold">
              SOCR Central Limit Theorem (CLT) App
            </CardTitle>
            <p className="text-blue-100 mt-2">
              Explore how sample means approach a normal distribution regardless of the population distribution
            </p>
          </CardHeader>

          <CardContent className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-1 md:col-span-1">
                <Label htmlFor="distribution">Population Distribution</Label>
                <Select value={selectedDistribution} onValueChange={setSelectedDistribution}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a distribution" />
                  </SelectTrigger>
                  <SelectContent>
                    {distributionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-1 md:col-span-1">
                <Label htmlFor="sampleSize">Sample Size</Label>
                <Slider
                  id="sampleSize"
                  defaultValue={[initialSampleSize]}
                  max={100}
                  min={1}
                  step={1}
                  onValueChange={(value) => setCurrentSampleSize(value[0])}
                />
                <p className="text-sm text-muted-foreground">
                  Current Sample Size: {currentSampleSize}
                </p>
              </div>

              <div className="col-span-1 md:col-span-1">
                <Label htmlFor="numSamples">Number of Samples</Label>
                <Slider
                  id="numSamples"
                  defaultValue={[initialNumSamples]}
                  max={5000}
                  min={100}
                  step={100}
                  onValueChange={(value) => setCurrentNumSamples(value[0])}
                />
                <p className="text-sm text-muted-foreground">
                  Current Number of Samples: {currentNumSamples}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-1">
                <Label htmlFor="animationSpeed">Animation Speed</Label>
                <Slider
                  id="animationSpeed"
                  defaultValue={[initialAnimationSpeed]}
                  max={100}
                  min={1}
                  step={1}
                  onValueChange={(value) => setAnimationSpeed(value[0])}
                />
                <p className="text-sm text-muted-foreground">
                  Adjust the speed of the simulation. Current speed: {animationSpeed}
                </p>
              </div>

              <div className="col-span-1 md:col-span-1 flex items-center justify-center space-x-4">
                <Button variant="outline" size="icon" onClick={toggleSimulation} disabled={!selectedDistribution}>
                  {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" onClick={resetSimulation}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={downloadData}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={editDrawing}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="sample-data" className="w-full">
          <TabsList className="w-full flex justify-center">
            <TabsTrigger value="sample-data">Sample Data</TabsTrigger>
            <TabsTrigger value="distribution-of-means">Distribution of Sample Means</TabsTrigger>
          </TabsList>
          <TabsContent value="sample-data" className="mt-2">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Sample Data Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={samples.map((sample, index) => ({
                    sampleIndex: index + 1,
                    ...Object.fromEntries(sample.map((value, i) => [`value${i + 1}`, value]))
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sampleIndex" label={{ value: 'Sample Index', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Value', angle: -90, position: 'insideLeft', offset: -5 }} />
                    <Tooltip />
                    {Array.from({ length: currentSampleSize }, (_, i) => `value${i + 1}`).map((valueKey, index) => (
                      <Line
                        key={valueKey}
                        type="monotone"
                        dataKey={valueKey}
                        stroke={`#${Math.floor(Math.random() * 16777215).toString(16)}`}
                        strokeWidth={1}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="distribution-of-means" className="mt-2">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Distribution of Sample Means</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={sampleMeans.map((mean, index) => ({ sampleIndex: index + 1, mean }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sampleIndex" label={{ value: 'Sample Index', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Mean', angle: -90, position: 'insideLeft', offset: -5 }} />
                    <Tooltip />
                    <Bar dataKey="mean" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
