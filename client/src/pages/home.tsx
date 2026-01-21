import React, { useState, useEffect } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { EditorPanel } from "@/components/clinical/editor-panel";
import { DocumentViewer } from "@/components/clinical/document-viewer";
import { ClinicalInputs, GeneratedPlan, generateTreatmentPlan } from "@/lib/clinical-generator";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();
  
  // Initialize state from localStorage or defaults
  const [inputs, setInputs] = useState<ClinicalInputs>(() => {
    const saved = localStorage.getItem("clinical-inputs");
    return saved ? JSON.parse(saved) : {
      intake_form_data: "",
      session_transcripts: "",
      assessment_scores: "",
      provider_notes: "",
      use_image_signature: true,
      provider_signature_url: "https://drive.google.com/thumbnail?id=1aAzhkTD4fhh0KkADkv_MNR9jYAO0Lmco&sz=w1000",
      privacy_mode: false,
      date_of_service: new Date().toISOString().split('T')[0],
      client_id: ""
    };
  });

  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(() => {
    const saved = localStorage.getItem("generated-plan");
    return saved ? JSON.parse(saved) : null;
  });

  // Autosave effect
  useEffect(() => {
    localStorage.setItem("clinical-inputs", JSON.stringify(inputs));
  }, [inputs]);

  useEffect(() => {
    if (generatedPlan) {
      localStorage.setItem("generated-plan", JSON.stringify(generatedPlan));
    }
  }, [generatedPlan]);

  const handleGenerate = () => {
    try {
      const plan = generateTreatmentPlan(inputs);
      setGeneratedPlan(plan);
      toast({
        title: "Plan Generated",
        description: "Clinical documentation has been compiled.",
      });
    } catch (e) {
      toast({
        title: "Generation Failed",
        description: "There was an error processing the inputs.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-background flex flex-col">
      <header className="h-12 border-b flex items-center px-4 bg-white z-10 print:hidden">
        <h1 className="font-serif font-bold text-lg text-slate-800">GoldStandard<span className="text-blue-600">Clinical</span></h1>
        <div className="ml-auto flex items-center space-x-4 text-sm text-muted-foreground">
           <span>Secure Client-Side Processing</span>
           <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
        </div>
      </header>
      
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={40} minSize={30} maxSize={60} className="print:hidden">
            <EditorPanel 
              inputs={inputs} 
              setInputs={setInputs} 
              onGenerate={handleGenerate} 
            />
          </ResizablePanel>
          
          <ResizableHandle className="print:hidden" />
          
          <ResizablePanel defaultSize={60}>
            <DocumentViewer 
              data={generatedPlan} 
              clinicalData={inputs}
              dateOfService={inputs.date_of_service}
              clientId={inputs.client_id}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
