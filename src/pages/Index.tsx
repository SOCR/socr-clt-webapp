
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ManualDistribution } from "@/lib/distributions/manual";
import { 
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import ManualDistributionDrawer from "@/components/ManualDistributionDrawer";

const Index = () => {
  const [manualDistribution] = useState(new ManualDistribution());
  
  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center my-6">
          SOCR Central Limit Theorem (CLT App)
        </h1>
        
        <div className="flex flex-col items-center space-y-6">
          <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Distribution Simulator</h2>
            <p className="text-gray-600 mb-6">
              Explore the Central Limit Theorem by examining various probability distributions and 
              how sample means behave as sample size increases.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center mb-6">
              <ErrorBoundary fallback={<div className="text-red-500">Error loading distribution drawer</div>}>
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button variant="default">Draw Custom Distribution</Button>
                  </DrawerTrigger>
                  <DrawerContent className="h-[90vh] max-h-[90vh] overflow-y-auto">
                    <DrawerHeader>
                      <DrawerTitle>Manual Distribution Drawing</DrawerTitle>
                      <DrawerDescription>
                        Draw your own probability distribution and generate samples from it.
                      </DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 pb-4">
                      <ManualDistributionDrawer 
                        distribution={manualDistribution} 
                        onDistributionChange={(dist) => {
                          console.log("Distribution updated");
                        }} 
                      />
                    </div>
                  </DrawerContent>
                </Drawer>
              </ErrorBoundary>
            </div>
          </div>
        </div>
        
        <ErrorBoundary fallback={<div className="text-red-500">Error loading footer</div>}>
          <Footer />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
};

export default Index;
