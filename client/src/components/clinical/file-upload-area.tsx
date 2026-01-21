import React, { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Mic, AlertTriangle, Trash2, CheckCircle2, Loader2, Settings2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { extractTextFromPdf } from "@/lib/pdf-utils";
import { SupabaseConfigDialog } from "@/components/clinical/supabase-config-dialog";
import { ExtractionReviewDialog } from "@/components/clinical/extraction-review-dialog";
import { getStoredSupabaseConfig, processWithSupabase, SupabaseConfig } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";
import { ClinicalInputs } from "@/lib/clinical-generator";

interface FileUploadAreaProps {
  onDataExtracted: (data: { source: string; text: string; targets: (keyof ClinicalInputs)[] }) => void;
}

interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  type: 'pdf' | 'audio' | 'text';
  extractedText?: string;
  error?: string;
  isScanned?: boolean;
}

export function FileUploadArea({ onDataExtracted }: FileUploadAreaProps) {
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getStoredSupabaseConfig());
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [reviewData, setReviewData] = useState<{ source: string; text: string; type: string } | null>(null);

  useEffect(() => {
    // Reload config when dialog closes/updates
    if (!isConfigOpen) {
      setSupabaseConfig(getStoredSupabaseConfig());
    }
  }, [isConfigOpen]);

  const onDrop = async (acceptedFiles: File[], type: 'pdf' | 'audio' | 'text') => {
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'pending' as const,
      type
    }));

    setFiles(prev => [...prev, ...newFiles]);
    
    // Auto-process based on type
    for (const fileObj of newFiles) {
      processFile(fileObj);
    }
  };

  const processFile = async (fileObj: UploadedFile) => {
    updateFileStatus(fileObj.id, 'processing');

    try {
      let text = "";
      let isScanned = false;

      if (fileObj.type === 'pdf') {
        const result = await extractTextFromPdf(fileObj.file);
        text = result.text;
        isScanned = result.isScanned;

        if (isScanned && supabaseConfig.enabled) {
          // Auto-escalate to Supabase OCR if enabled
          text = await processWithSupabase(fileObj.file, 'ocr', supabaseConfig);
          isScanned = false; // Resolved by OCR
        }
      } else if (fileObj.type === 'audio') {
        if (supabaseConfig.enabled) {
          text = await processWithSupabase(fileObj.file, 'transcribe', supabaseConfig);
        } else {
          // Fallback or error if no local transcription
          throw new Error("Supabase required for audio");
        }
      } else {
        text = await fileObj.file.text();
      }

      updateFileStatus(fileObj.id, isScanned ? 'error' : 'completed', text, undefined, isScanned);
      
      if (!isScanned) {
        // Trigger review for successful extraction
        setReviewData({ source: fileObj.file.name, text, type: fileObj.type });
      }

    } catch (err) {
      console.error(err);
      updateFileStatus(fileObj.id, 'error', undefined, "Processing failed");
    }
  };

  const updateFileStatus = (id: string, status: UploadedFile['status'], text?: string, error?: string, isScanned?: boolean) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, status, extractedText: text, error, isScanned } : f));
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const { getRootProps: getPdfProps, getInputProps: getPdfInputProps } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    onDrop: (f) => onDrop(f, 'pdf')
  });

  const { getRootProps: getAudioProps, getInputProps: getAudioInputProps } = useDropzone({
    accept: { 'audio/*': ['.mp3', '.wav', '.m4a'], 'text/plain': ['.txt'] },
    onDrop: (f) => {
      // Check file type manually for the mixed dropzone
      const audioFiles = f.filter(file => file.type.startsWith('audio'));
      const textFiles = f.filter(file => file.type === 'text/plain' || file.name.endsWith('.txt'));
      
      if (audioFiles.length) onDrop(audioFiles, 'audio');
      if (textFiles.length) onDrop(textFiles, 'text');
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center">
          <Upload className="w-4 h-4 mr-2" /> Uploads & Extraction
        </h3>
        <Button variant="ghost" size="xs" onClick={() => setIsConfigOpen(true)} className={supabaseConfig.enabled ? "text-green-600" : "text-muted-foreground"}>
          <Settings2 className="w-3 h-3 mr-1" />
          {supabaseConfig.enabled ? "Cloud Active" : "Local Mode"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div {...getPdfProps()} className="border-2 border-dashed border-slate-200 rounded-lg p-4 hover:bg-slate-50 cursor-pointer transition-colors text-center">
          <input {...getPdfInputProps()} />
          <FileText className="w-6 h-6 mx-auto text-slate-400 mb-2" />
          <p className="text-xs font-medium text-slate-600">Forms & PDFs</p>
          <p className="text-[10px] text-slate-400">Drag or click</p>
        </div>

        <div {...getAudioProps()} className="border-2 border-dashed border-slate-200 rounded-lg p-4 hover:bg-slate-50 cursor-pointer transition-colors text-center">
          <input {...getAudioInputProps()} />
          <Mic className="w-6 h-6 mx-auto text-slate-400 mb-2" />
          <p className="text-xs font-medium text-slate-600">Audio / Transcript</p>
          <p className="text-[10px] text-slate-400">Drag or click</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase">Files</p>
          {files.map(file => (
            <Card key={file.id} className="p-2 relative overflow-hidden">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center overflow-hidden">
                  {file.type === 'pdf' ? <FileText className="w-4 h-4 mr-2 text-blue-500 shrink-0" /> : <Mic className="w-4 h-4 mr-2 text-purple-500 shrink-0" />}
                  <span className="truncate max-w-[120px]" title={file.file.name}>{file.file.name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {file.status === 'processing' && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                  {file.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                  {file.status === 'error' && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(file.id)}>
                    <Trash2 className="w-3 h-3 text-slate-400" />
                  </Button>
                </div>
              </div>

              {file.status === 'processing' && <Progress value={45} className="h-1 mt-2" />}
              
              {file.isScanned && (
                <div className="mt-2 text-[10px] text-amber-600 bg-amber-50 p-1.5 rounded flex items-center justify-between">
                  <span className="flex items-center"><AlertTriangle className="w-3 h-3 mr-1" /> Scanned PDF</span>
                  {supabaseConfig.enabled ? (
                    <span className="text-green-600 font-medium">Auto-OCR active</span>
                  ) : (
                    <Button variant="outline" size="xs" className="h-5 text-[10px] bg-white" onClick={() => setIsConfigOpen(true)}>Enable OCR</Button>
                  )}
                </div>
              )}

              {file.status === 'error' && !file.isScanned && (
                 <p className="text-[10px] text-red-500 mt-1">{file.error}</p>
              )}

              {file.status === 'completed' && (
                 <Button 
                   variant="link" 
                   size="xs" 
                   className="h-4 p-0 text-[10px] text-blue-600 mt-1"
                   onClick={() => setReviewData({ source: file.file.name, text: file.extractedText || "", type: file.type })}
                 >
                   Review extracted data
                 </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      {!supabaseConfig.enabled ? (
        <Alert className="py-2 bg-slate-50 border-slate-200">
          <ShieldAlert className="h-4 w-4 text-slate-500" />
          <AlertTitle className="text-xs font-semibold text-slate-700">Privacy Mode: Local Only</AlertTitle>
          <AlertDescription className="text-[10px] text-slate-500">
            Files are processed in-browser. Enable Supabase for OCR & Transcription.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="py-2 bg-green-50 border-green-200">
          <ShieldAlert className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-xs font-semibold text-green-700">Cloud Features Active</AlertTitle>
          <AlertDescription className="text-[10px] text-green-600">
            Files may be temporarily stored for processing. 
            <Button variant="link" className="h-auto p-0 ml-1 text-[10px] text-green-800 underline">Delete stored files</Button>
          </AlertDescription>
        </Alert>
      )}

      <SupabaseConfigDialog 
        open={isConfigOpen} 
        onOpenChange={setIsConfigOpen} 
        config={supabaseConfig}
        onSave={(c) => {
          saveSupabaseConfig(c);
          setSupabaseConfig(c);
        }}
      />

      {reviewData && (
        <ExtractionReviewDialog 
          open={!!reviewData} 
          onOpenChange={(o) => !o && setReviewData(null)}
          data={reviewData}
          onConfirm={(mappedData) => {
            onDataExtracted({
              source: mappedData.source,
              text: mappedData.text,
              targets: mappedData.targets
            });
            setReviewData(null);
          }}
        />
      )}
    </div>
  );
}
