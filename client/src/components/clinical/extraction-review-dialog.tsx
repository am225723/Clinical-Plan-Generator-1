import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClinicalInputs } from "@/lib/clinical-generator";

interface ExtractionReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: { source: string; text: string; type: string };
  onConfirm: (mappedData: { source: string; text: string; type: string; targets: (keyof ClinicalInputs)[] }) => void;
}

export function ExtractionReviewDialog({ open, onOpenChange, data, onConfirm }: ExtractionReviewDialogProps) {
  const [targets, setTargets] = React.useState<(keyof ClinicalInputs)[]>([]);

  React.useEffect(() => {
    // Set defaults based on type
    if (data.type === 'pdf') {
      setTargets(['intake_form_data', 'assessment_scores']);
    } else if (data.type === 'audio') {
      setTargets(['session_transcripts']);
    } else {
      setTargets(['provider_notes']);
    }
  }, [data]);

  const toggleTarget = (target: keyof ClinicalInputs) => {
    setTargets(prev => 
      prev.includes(target) 
        ? prev.filter(t => t !== target)
        : [...prev, target]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Review Extracted Data</DialogTitle>
          <DialogDescription>
            Source: {data.source} • Select where to map this content.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
           <ScrollArea className="flex-1 border rounded-md p-4 bg-muted/50">
             <pre className="text-xs whitespace-pre-wrap font-mono">{data.text.substring(0, 1000)}{data.text.length > 1000 && "..."}</pre>
           </ScrollArea>

           <div className="space-y-3">
             <Label>Map to Clinical Sections:</Label>
             <div className="grid grid-cols-2 gap-4">
               <div className="flex items-center space-x-2">
                 <Checkbox id="map-intake" checked={targets.includes('intake_form_data')} onCheckedChange={() => toggleTarget('intake_form_data')} />
                 <Label htmlFor="map-intake">Intake Form Data</Label>
               </div>
               <div className="flex items-center space-x-2">
                 <Checkbox id="map-scores" checked={targets.includes('assessment_scores')} onCheckedChange={() => toggleTarget('assessment_scores')} />
                 <Label htmlFor="map-scores">Assessment Scores</Label>
               </div>
               <div className="flex items-center space-x-2">
                 <Checkbox id="map-session" checked={targets.includes('session_transcripts')} onCheckedChange={() => toggleTarget('session_transcripts')} />
                 <Label htmlFor="map-session">Session Transcripts</Label>
               </div>
               <div className="flex items-center space-x-2">
                 <Checkbox id="map-notes" checked={targets.includes('provider_notes')} onCheckedChange={() => toggleTarget('provider_notes')} />
                 <Label htmlFor="map-notes">Provider Notes</Label>
               </div>
             </div>
           </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onConfirm({ ...data, targets })}>Confirm & Merge</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
