import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Stethoscope, ClipboardList, User, Settings, Sparkles, Database } from "lucide-react";
import { ClinicalInputs, DEMO_DATA } from "@/lib/clinical-generator";
import { FileUploadArea } from "@/components/clinical/file-upload-area";
import { useToast } from "@/hooks/use-toast";

interface EditorPanelProps {
  inputs: ClinicalInputs;
  setInputs: (inputs: ClinicalInputs) => void;
  onGenerate: () => void;
}

export function EditorPanel({ inputs, setInputs, onGenerate }: EditorPanelProps) {
  const { toast } = useToast();

  const handleChange = (field: keyof ClinicalInputs, value: string | boolean) => {
    setInputs({ ...inputs, [field]: value });
  };

  const loadDemo = () => {
    setInputs({ ...inputs, ...DEMO_DATA });
  };

  const handleDataExtracted = (data: { source: string; text: string; targets: (keyof ClinicalInputs)[] }) => {
    const newInputs = { ...inputs };
    let mappedCount = 0;

    data.targets.forEach((target) => {
       if (typeof newInputs[target] === 'string') {
         const currentContent = newInputs[target] as string;
         const separator = currentContent ? "\n\n" : "";
         const sourceLabel = `[Extracted from ${data.source}]\n`;
         newInputs[target] = `${currentContent}${separator}${sourceLabel}${data.text}`;
         mappedCount++;
       }
    });

    setInputs(newInputs);
    toast({
      title: "Data Merged",
      description: `Content extracted from ${data.source} mapped to ${mappedCount} sections.`,
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200">
      <div className="p-4 border-b bg-white flex justify-between items-center">
        <div>
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-blue-600" />
            Clinical Inputs
          </h2>
          <p className="text-xs text-muted-foreground">Enter raw data below to generate plan.</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadDemo} className="text-xs">
          <Database className="w-3 h-3 mr-1" /> Load Demo Data
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          
          {/* Metadata Section */}
          <Card className="shadow-sm border-slate-200">
             <CardContent className="p-4 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dos" className="text-xs uppercase font-bold text-slate-500">Date of Service</Label>
                  <Input 
                    id="dos" 
                    type="date" 
                    value={inputs.date_of_service} 
                    onChange={(e) => handleChange('date_of_service', e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_id" className="text-xs uppercase font-bold text-slate-500">Client ID</Label>
                  <Input 
                    id="client_id" 
                    value={inputs.client_id} 
                    onChange={(e) => handleChange('client_id', e.target.value)}
                    className="h-8"
                  />
                </div>
             </CardContent>
          </Card>

          {/* New Upload Area */}
          <FileUploadArea onDataExtracted={handleDataExtracted} />

          <Tabs defaultValue="intake" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-2">
              <TabsTrigger value="intake"><User className="w-4 h-4 mr-2" /> Intake</TabsTrigger>
              <TabsTrigger value="transcripts"><FileText className="w-4 h-4 mr-2" /> Session</TabsTrigger>
              <TabsTrigger value="scores"><ClipboardList className="w-4 h-4 mr-2" /> Scores</TabsTrigger>
              <TabsTrigger value="notes"><Stethoscope className="w-4 h-4 mr-2" /> Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="intake">
              <Label className="mb-2 block">Intake Form Data</Label>
              <Textarea 
                placeholder="Paste intake form contents here (Demographics, Chief Complaint, History)..."
                className="min-h-[300px] font-mono text-sm leading-relaxed"
                value={inputs.intake_form_data}
                onChange={(e) => handleChange('intake_form_data', e.target.value)}
              />
            </TabsContent>

            <TabsContent value="transcripts">
              <Label className="mb-2 block">Session Transcripts</Label>
              <Textarea 
                placeholder="Paste raw transcripts or dictation here..."
                className="min-h-[300px] font-mono text-sm leading-relaxed"
                value={inputs.session_transcripts}
                onChange={(e) => handleChange('session_transcripts', e.target.value)}
              />
            </TabsContent>

            <TabsContent value="scores">
              <Label className="mb-2 block">Assessment Scores</Label>
              <Textarea 
                placeholder="Paste GAD-7, PHQ-9, or other scale results..."
                className="min-h-[300px] font-mono text-sm leading-relaxed"
                value={inputs.assessment_scores}
                onChange={(e) => handleChange('assessment_scores', e.target.value)}
              />
            </TabsContent>

            <TabsContent value="notes">
              <Label className="mb-2 block">Provider Notes / MSE</Label>
              <Textarea 
                placeholder="Paste rough notes, MSE observations, and plan ideas..."
                className="min-h-[300px] font-mono text-sm leading-relaxed"
                value={inputs.provider_notes}
                onChange={(e) => handleChange('provider_notes', e.target.value)}
              />
            </TabsContent>
          </Tabs>

          {/* Settings Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
             <h3 className="text-sm font-semibold flex items-center text-slate-700">
               <Settings className="w-4 h-4 mr-2" /> Configuration
             </h3>
             
             <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Privacy Mode</Label>
                  <p className="text-xs text-muted-foreground">Mask client identifiers on screen</p>
                </div>
                <Switch 
                  checked={inputs.privacy_mode}
                  onCheckedChange={(c) => handleChange('privacy_mode', c)}
                />
             </div>

             <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Use Image Signature</Label>
                  <p className="text-xs text-muted-foreground">Toggle between image/font</p>
                </div>
                <Switch 
                  checked={inputs.use_image_signature}
                  onCheckedChange={(c) => handleChange('use_image_signature', c)}
                />
             </div>

             {inputs.use_image_signature && (
               <div className="space-y-1">
                 <Label className="text-xs">Signature URL</Label>
                 <Input 
                   className="h-7 text-xs" 
                   value={inputs.provider_signature_url}
                   onChange={(e) => handleChange('provider_signature_url', e.target.value)}
                 />
               </div>
             )}
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-white">
        <Button onClick={onGenerate} className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md">
          <Sparkles className="w-4 h-4 mr-2" /> Generate Treatment Plan
        </Button>
      </div>
    </div>
  );
}
