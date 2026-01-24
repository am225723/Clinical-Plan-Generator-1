import React, { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { GeneratorForm } from "@/components/generator/GeneratorForm";
import { DocumentViewer } from "@/components/clinical/document-viewer";
import { ClinicalInputs, GeneratedPlan, generateTreatmentPlan } from "@/lib/clinical-generator";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { Button } from "@/components/ui/button";
import { saveTreatmentPlan } from "@/lib/supabase-client";
import { Save } from "lucide-react";

export default function GeneratorPage() {
    const { toast } = useToast();
    const { user } = useSupabaseAuth();

    // State
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
    const [viewMode, setViewMode] = useState<'input' | 'output'>('input');

    // Effects
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
            setViewMode('output');
            toast({
                title: "Plan Generated",
                description: "Clinical documentation has been compiled.",
            });
        } catch (e: any) {
            toast({
                title: "Generation Failed",
                description: e.message || "Error generating plan.",
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
                description: e.message || "Could not save to database.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Layout>
            <div className="flex flex-col h-full relative min-h-screen">
                {viewMode === 'input' ? (
                     <div className="flex-1 flex flex-col">
                        <header className="pt-12 pb-2 px-6 flex justify-between items-center bg-transparent z-10">
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Patient Intake</h1>
                                <p className="text-primary font-medium text-sm">New Clinical Entry</p>
                            </div>
                            {generatedPlan && (
                                <Button variant="outline" size="sm" onClick={() => setViewMode('output')}>
                                    View Plan
                                </Button>
                            )}
                        </header>
                        <GeneratorForm
                            inputs={inputs}
                            setInputs={setInputs}
                            onGenerate={handleGenerate}
                            isGenerating={isGenerating}
                        />
                     </div>
                ) : (
                    <div className="flex-1 flex flex-col h-screen pb-20 absolute top-0 left-0 w-full bg-background z-20">
                        <header className="px-6 py-4 flex items-center justify-between bg-white dark:bg-background-dark border-b border-gray-200 dark:border-white/5 print:hidden">
                            <button onClick={() => setViewMode('input')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer">
                                <span className="material-symbols-outlined">arrow_back</span>
                                <span className="text-sm font-medium">Back to Inputs</span>
                            </button>
                            <div className="flex items-center gap-3">
                                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900 dark:text-white">Treatment Plan</h2>
                                {user && generatedPlan && (
                                    <Button
                                        size="sm"
                                        onClick={handleSaveToCloud}
                                        disabled={isSaving}
                                        variant="outline"
                                        className="h-8 gap-1"
                                    >
                                        <Save className="h-3.5 w-3.5" />
                                        {isSaving ? "Saving..." : "Save"}
                                    </Button>
                                )}
                            </div>
                        </header>
                         <div className="flex-1 overflow-hidden">
                            <DocumentViewer
                                data={generatedPlan}
                                clinicalData={inputs}
                                dateOfService={inputs.date_of_service}
                                clientId={inputs.client_id}
                            />
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
