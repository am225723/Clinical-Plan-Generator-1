import React, { useState, useEffect } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { EditorPanel } from "@/components/clinical/editor-panel";
import { DocumentViewer } from "@/components/clinical/document-viewer";
import { ClinicalInputs, GeneratedPlan, generateTreatmentPlan } from "@/lib/clinical-generator";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { AuthModal } from "@/components/auth/auth-modal";
import { SettingsModal } from "@/components/settings/supabase-settings";
import { Button } from "@/components/ui/button";
import { saveTreatmentPlan } from "@/lib/supabase-client";
import { Settings, LogIn, LogOut, User, Save, Cloud, CloudOff, AlertCircle } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const { user, loading: authLoading, isConfigured, connectionVerified, error: authError, signIn, signUp, signOut } = useSupabaseAuth();
  
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  
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

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Autosave effect
  useEffect(() => {
    localStorage.setItem("clinical-inputs", JSON.stringify(inputs));
  }, [inputs]);

  useEffect(() => {
    if (generatedPlan) {
      localStorage.setItem("generated-plan", JSON.stringify(generatedPlan));
    }
  }, [generatedPlan]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const plan = await generateTreatmentPlan(inputs);
      setGeneratedPlan(plan);
      toast({
        title: "Plan Generated",
        description: "Clinical documentation has been compiled.",
      });
    } catch (e: any) {
      toast({
        title: "Generation Failed",
        description: e.message || "There was an error processing the inputs.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToCloud = async () => {
    if (!user || !generatedPlan) return;
    
    setIsSaving(true);
    try {
      const { data, error } = await saveTreatmentPlan({
        patient_id: inputs.client_id || 'unknown',
        client_id: inputs.client_id,
        inputs: inputs,
        generated_plan: generatedPlan,
        date_of_service: inputs.date_of_service
      });
      
      if (error) throw error;
      
      toast({
        title: "Saved to Cloud",
        description: "Treatment plan has been saved to your Supabase database.",
      });
    } catch (e: any) {
      toast({
        title: "Save Failed",
        description: e.message || "Could not save to database. Make sure the 'treatment_plans' table exists.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({ title: "Sign Out Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Signed Out", description: "You have been signed out." });
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-background flex flex-col">
      <header className="h-12 border-b flex items-center px-4 bg-white z-10 print:hidden">
        <h1 className="font-serif font-bold text-lg text-slate-800">
          GoldStandard<span className="text-blue-600">Clinical</span>
        </h1>
        
        <div className="ml-auto flex items-center space-x-2">
          {/* Cloud status indicator - only show "Connected" when actually verified */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-2">
            {isConfigured && connectionVerified ? (
              <>
                <Cloud className="h-4 w-4 text-green-500" />
                <span className="hidden sm:inline">Supabase Connected</span>
              </>
            ) : isConfigured && authError ? (
              <>
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="hidden sm:inline text-amber-600">Connection Issue</span>
              </>
            ) : (
              <>
                <CloudOff className="h-4 w-4 text-gray-400" />
                <span className="hidden sm:inline">Local Mode</span>
              </>
            )}
          </div>
          
          {/* Save to cloud button (only when authenticated and has plan) */}
          {user && generatedPlan && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSaveToCloud}
              disabled={isSaving}
              data-testid="button-save-cloud"
            >
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          )}
          
          {/* Auth buttons */}
          {isConfigured && !authLoading && (
            user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  <User className="h-4 w-4 inline mr-1" />
                  {user.email?.split('@')[0]}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSignOut}
                  data-testid="button-signout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setAuthModalOpen(true)}
                data-testid="button-signin"
              >
                <LogIn className="h-4 w-4 mr-1" />
                Sign In
              </Button>
            )
          )}
          
          {/* Settings button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSettingsModalOpen(true)}
            data-testid="button-settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>
      
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={40} minSize={30} maxSize={60} className="print:hidden">
            <EditorPanel 
              inputs={inputs} 
              setInputs={setInputs} 
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
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
      
      {/* Modals */}
      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen}
        onSignIn={signIn}
        onSignUp={signUp}
      />
      <SettingsModal 
        open={settingsModalOpen} 
        onOpenChange={setSettingsModalOpen}
        onSettingsChange={() => window.location.reload()}
      />
    </div>
  );
}
