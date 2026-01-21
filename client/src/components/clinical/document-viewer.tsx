import React from "react";
import { cn } from "@/lib/utils";
import { GeneratedPlan } from "@/lib/clinical-generator";
import { format } from "date-fns";
import { AlertTriangle, Download, Printer, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface DocumentViewerProps {
  data: GeneratedPlan | null;
  clinicalData: any;
  dateOfService: string;
  clientId: string;
}

export function DocumentViewer({ data, clinicalData, dateOfService, clientId }: DocumentViewerProps) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    if (containerRef.current) {
      // Get the outer HTML of the document content
      const content = containerRef.current.innerHTML;
      const fullHtml = `<!DOCTYPE html>
<html>
<head>
<title>Treatment Plan - ${clientId}</title>
<style>
  body { font-family: 'Times New Roman', serif; line-height: 1.5; color: #000; }
  h1, h2, h3 { color: #2c3e50; }
  .section { margin-bottom: 20px; }
  .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
  th { background-color: #f2f2f2; }
</style>
</head>
<body>
${content}
</body>
</html>`;
      
      navigator.clipboard.writeText(fullHtml).then(() => {
        setCopied(true);
        toast({
          title: "Copied to Clipboard",
          description: "Full HTML document is ready to paste.",
        });
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center bg-white/50 rounded-lg border-2 border-dashed">
        <Printer className="w-12 h-12 mb-4 opacity-20" />
        <h3 className="text-lg font-semibold">Ready to Generate</h3>
        <p className="max-w-xs text-sm mt-2">
          Enter clinical data on the left panel and click "Generate Treatment Plan" to verify logic and create the document.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#525659] p-4 md:p-8 overflow-hidden relative group">
      {/* Action Bar */}
      <div className="absolute top-4 right-8 z-10 flex gap-2 action-bar print:hidden opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="secondary" size="sm" onClick={handleCopy} className="shadow-lg">
          {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? "Copied" : "Copy HTML"}
        </Button>
        <Button onClick={handlePrint} size="sm" className="shadow-lg bg-blue-600 hover:bg-blue-700 text-white">
          <Printer className="w-4 h-4 mr-2" />
          Print / PDF
        </Button>
      </div>

      <div className="flex-1 overflow-auto flex justify-center custom-scrollbar">
        {/* The Paper Sheet */}
        <div 
          ref={containerRef}
          className="document-viewer paper-sheet bg-white w-[8.5in] min-h-[11in] p-[0.5in] shadow-2xl text-[11pt] text-gray-900 font-serif leading-relaxed"
          style={{ fontFamily: '"Merriweather", serif' }}
        >
          {/* Missing Data Alert (Screen Only) */}
          {data.missing_data.length > 0 && (
            <div className="missing-data-alert bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded print:hidden no-print">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
                <div>
                  <h3 className="text-sm font-bold text-amber-800">Missing Required Data</h3>
                  <ul className="list-disc list-inside text-xs text-amber-700 mt-1">
                    {data.missing_data.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <header className="border-b-2 border-gray-800 pb-4 mb-6">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">Psychiatric Treatment Plan</h1>
                <p className="text-sm text-gray-600 mt-1 font-sans">Confidential Medical Record</p>
              </div>
              <div className="text-right font-sans text-sm">
                <p><strong>Date of Service:</strong> {dateOfService}</p>
                <p><strong>Client ID:</strong> {clinicalData.privacy_mode ? "REDACTED" : clientId}</p>
                <p><strong>Provider:</strong> Douglas Zelisko, MD</p>
              </div>
            </div>
          </header>

          {/* Clinical Sections */}
          <div className="space-y-6">
            
            {/* 1. Chief Complaint */}
            <section className="section-block">
              <h2 className="text-sm font-bold uppercase text-gray-700 border-b border-gray-300 mb-2 font-sans">1. Chief Complaint</h2>
              <p className="italic">{data.chief_complaint}</p>
            </section>

            {/* 2. HPI */}
            <section className="section-block">
              <h2 className="text-sm font-bold uppercase text-gray-700 border-b border-gray-300 mb-2 font-sans">2. History of Present Illness (HPI)</h2>
              <p>{data.hpi}</p>
            </section>

            {/* 3 & 4. ROS & Substance */}
            <div className="grid grid-cols-2 gap-6 section-block">
              <div>
                <h2 className="text-sm font-bold uppercase text-gray-700 border-b border-gray-300 mb-2 font-sans">3. Psychiatric ROS</h2>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {data.psych_ros.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase text-gray-700 border-b border-gray-300 mb-2 font-sans">4. Substance Use</h2>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {data.substance_use.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            </div>

            {/* 5. History */}
            <section className="section-block">
              <h2 className="text-sm font-bold uppercase text-gray-700 border-b border-gray-300 mb-2 font-sans">5. Medical & Psychiatric History</h2>
              <p>{data.psych_medical_history}</p>
            </section>

            {/* 6. Meds */}
            <section className="section-block">
              <h2 className="text-sm font-bold uppercase text-gray-700 border-b border-gray-300 mb-2 font-sans">6. Current Medications</h2>
              <table className="w-full text-sm border border-gray-300">
                <thead className="bg-gray-100 font-sans">
                  <tr>
                    <th className="p-2 border border-gray-300 text-left">Medication</th>
                    <th className="p-2 border border-gray-300 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.current_meds.map((med, i) => (
                    <tr key={i}>
                      <td className="p-2 border border-gray-300">{med}</td>
                      <td className="p-2 border border-gray-300">Active</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* 7. MSE */}
            <section className="section-block">
              <h2 className="text-sm font-bold uppercase text-gray-700 border-b border-gray-300 mb-2 font-sans">7. Mental Status Exam (MSE)</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {data.mse.map((item, i) => (
                  <div key={i} className="border-b border-dotted border-gray-200 py-1">{item}</div>
                ))}
              </div>
            </section>

            {/* 8. Risk */}
            <section className="section-block">
              <h2 className="text-sm font-bold uppercase text-gray-700 border-b border-gray-300 mb-2 font-sans">8. Risk Assessment</h2>
              <div className="bg-gray-50 p-3 border border-gray-200 rounded-sm">
                <p><strong>Acute Risk Level:</strong> {data.risk_assessment.level}</p>
                <p className="mt-1"><strong>Rationale:</strong> {data.risk_assessment.justification}</p>
              </div>
            </section>

            {/* 9. Diagnosis */}
            <section className="section-block">
              <h2 className="text-sm font-bold uppercase text-gray-700 border-b border-gray-300 mb-2 font-sans">9. Assessment & Diagnosis</h2>
              <table className="w-full text-sm border border-gray-300">
                <thead className="bg-gray-100 font-sans">
                  <tr>
                    <th className="p-2 border border-gray-300 text-left">Code</th>
                    <th className="p-2 border border-gray-300 text-left">Diagnosis Name</th>
                    <th className="p-2 border border-gray-300 text-left">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {data.diagnosis.map((dx, i) => (
                    <tr key={i}>
                      <td className="p-2 border border-gray-300 font-mono">{dx.code}</td>
                      <td className="p-2 border border-gray-300 font-bold">{dx.name}</td>
                      <td className="p-2 border border-gray-300 text-gray-500">{dx.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* 10. Goals */}
            <section className="section-block">
              <h2 className="text-sm font-bold uppercase text-gray-700 border-b border-gray-300 mb-2 font-sans">10. Treatment Goals & Objectives</h2>
              <div className="space-y-4">
                {data.treatment_goals.map((g, i) => (
                  <div key={i} className="pl-4 border-l-2 border-gray-300">
                    <p className="font-bold text-sm mb-1">Goal {i+1}: {g.goal}</p>
                    <ul className="list-square list-inside text-sm text-gray-700 pl-2">
                      {g.objectives.map((obj, j) => <li key={j}>{obj}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* 11. MDM */}
            <section className="section-block">
              <h2 className="text-sm font-bold uppercase text-gray-700 border-b border-gray-300 mb-2 font-sans">11. Medical Decision Making (MDM)</h2>
              <p className="text-sm"><span className="font-bold">Code Selection:</span> {data.mdm.code} ({data.mdm.complexity} Complexity)</p>
              <p className="text-sm mt-1">{data.mdm.rationale}</p>
            </section>

            {/* 12, 13, 14, 15 Plan Details */}
            <div className="grid grid-cols-1 gap-4 section-block">
               <div>
                 <h2 className="text-sm font-bold uppercase text-gray-700 border-b border-gray-300 mb-2 font-sans">12. Psychotherapy</h2>
                 <p className="text-sm">{data.psychotherapy_addon}</p>
               </div>
               <div>
                 <h2 className="text-sm font-bold uppercase text-gray-700 border-b border-gray-300 mb-2 font-sans">13. Prescription Plan</h2>
                 <p className="text-sm">{data.prescription_plan}</p>
               </div>
               <div>
                 <h2 className="text-sm font-bold uppercase text-gray-700 border-b border-gray-300 mb-2 font-sans">14. Informed Consent</h2>
                 <p className="text-sm">{data.informed_consent}</p>
               </div>
               <div>
                 <h2 className="text-sm font-bold uppercase text-gray-700 border-b border-gray-300 mb-2 font-sans">15. Labs / Testing</h2>
                 <p className="text-sm">{data.labs}</p>
               </div>
            </div>

            {/* 16. Signature */}
            <section className="mt-12 pt-4 border-t-2 border-black signature-block">
              <h2 className="text-sm font-bold uppercase text-gray-700 mb-6 font-sans">16. Authentication & Agreement</h2>
              
              <div className="grid grid-cols-2 gap-12">
                <div className="signature-area">
                  <div className="h-20 mb-2 flex items-end">
                    {clinicalData.use_image_signature && clinicalData.provider_signature_url ? (
                      <img 
                        src={clinicalData.provider_signature_url} 
                        alt="Dr. Zelisko Signature" 
                        className="max-h-20 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          // Could show fallback logic here if needed, but styling handles layout
                        }}
                      />
                    ) : (
                       <span className="text-3xl" style={{ fontFamily: '"Dancing Script", cursive' }}>Douglas Zelisko, MD</span>
                    )}
                  </div>
                  <div className="border-t border-black pt-1">
                    <p className="font-bold">Douglas Zelisko, MD</p>
                    <p className="text-xs text-gray-600">Board Certified Psychiatrist</p>
                    <p className="text-xs text-gray-600">Signed electronically on {format(new Date(), 'MM/dd/yyyy HH:mm:ss')}</p>
                  </div>
                </div>

                <div className="signature-area">
                   <div className="h-20 mb-2 flex items-end">
                     <span className="italic text-gray-500">Verbal Consent Obtained via Telehealth</span>
                   </div>
                   <div className="border-t border-black pt-1">
                    <p className="font-bold">Client Signature / Consent</p>
                    <p className="text-xs text-gray-600">Client reviewed and agreed to plan.</p>
                  </div>
                </div>
              </div>

              <p className="text-center text-[10px] text-gray-400 mt-12 font-sans">
                Generated by Clinical AI Assistant • {clinicalData.privacy_mode ? "REDACTED ID" : clientId} • Page 1 of 1
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
