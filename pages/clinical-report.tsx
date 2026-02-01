import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabase } from './_app';
import { requireDoctor } from '@/lib/auth';
import { Profile } from '@/lib/supabase';
import { edgeFunctions } from '@/lib/edge-functions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, FileText, Download, ArrowLeft, Sparkles, ClipboardList, FileCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/dashboard/header';

interface ClinicalReportPageProps {
  user: any;
  profile: Profile;
}

interface ClinicalReport {
  clinical_summary: string;
  follow_up_questions: string[];
  extended_report: {
    patient_summary: string;
    history_of_presenting_illness: string;
    symptom_categorization: {
      physical: string[];
      emotional: string[];
      cognitive: string[];
    };
    recommended_clinical_follow_up: string[];
  };
}

export default function ClinicalReportPage({ user, profile }: ClinicalReportPageProps) {
  const { supabase } = useSupabase();
  const router = useRouter();
  const { toast } = useToast();

  const [intakeText, setIntakeText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [report, setReport] = useState<ClinicalReport | null>(null);
  const [currentStep, setCurrentStep] = useState<'input' | 'report'>('input');

  const handleGenerateReport = async () => {
    if (!intakeText.trim()) {
      toast({
        title: 'Missing Input',
        description: 'Please enter patient intake text to generate a report.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await edgeFunctions.generate.treatmentPlan(supabase, {
        inputs: {
          intake_form_data: intakeText,
        },
        patientData: {},
        detailLevel: 'detailed',
        customPrompt: `You are an expert Clinical Documentation AI. Process the patient intake text and generate a comprehensive clinical report.

Generate a JSON response with the following structure:
{
  "clinical_summary": "A concise, professional summary of the patient's current status, presenting problems, and relevant history. Single coherent paragraph.",
  "follow_up_questions": ["Array of targeted follow-up questions to gather missing information for a formal Treatment Plan. Questions should cover: Client Demographics, Therapy Modality, Presenting Problem, Reason for Treatment, Diagnosis info, Symptoms, Goals, Actionable Steps, Timeline, and Interventions."],
  "extended_report": {
    "patient_summary": "Expanded version of the clinical summary suitable for medical records.",
    "history_of_presenting_illness": "Detailed narrative of the chief complaint and its development.",
    "symptom_categorization": {
      "physical": ["Array of physical symptoms"],
      "emotional": ["Array of emotional symptoms"],
      "cognitive": ["Array of cognitive symptoms"]
    },
    "recommended_clinical_follow_up": ["Array of suggested next steps for clinical care"]
  }
}

Patient Intake Text:
${intakeText}`,
      });

      if (result) {
        setReport(result as ClinicalReport);
        setCurrentStep('report');
        toast({
          title: 'Report Generated',
          description: 'Clinical report has been generated successfully.',
        });
      }
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!report) return;

    setIsGeneratingPdf(true);
    try {
      const pdfContent = `
# CLINICAL INTAKE SUMMARY

${report.clinical_summary}

---

# REQUIRED FOLLOW-UP FOR TREATMENT PLAN

${report.follow_up_questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

---

# EXTENDED CLINICAL REPORT

## PATIENT SUMMARY
${report.extended_report.patient_summary}

## HISTORY OF PRESENTING ILLNESS
${report.extended_report.history_of_presenting_illness}

## SYMPTOM CATEGORIZATION

### Physical Symptoms
${report.extended_report.symptom_categorization.physical?.map(s => `- ${s}`).join('\n') || 'None documented'}

### Emotional Symptoms
${report.extended_report.symptom_categorization.emotional?.map(s => `- ${s}`).join('\n') || 'None documented'}

### Cognitive Symptoms
${report.extended_report.symptom_categorization.cognitive?.map(s => `- ${s}`).join('\n') || 'None documented'}

## RECOMMENDED CLINICAL FOLLOW-UP
${report.extended_report.recommended_clinical_follow_up?.map(s => `- ${s}`).join('\n') || 'None documented'}

---
*Confidential Clinical Document*
`;

      const result = await edgeFunctions.generate.pdf(supabase, {
        content: pdfContent,
        title: 'Clinical Report',
        footer: 'Confidential Clinical Document',
      });

      if (result?.html) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(result.html);
          printWindow.document.close();
          printWindow.print();
        }
      }

      toast({
        title: 'PDF Ready',
        description: 'Your clinical report is ready for download.',
      });
    } catch (error) {
      toast({
        title: 'PDF Generation Failed',
        description: 'Could not generate PDF. You can copy the report content instead.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyReport = () => {
    if (!report) return;

    const textContent = `CLINICAL INTAKE SUMMARY

${report.clinical_summary}

REQUIRED FOLLOW-UP FOR TREATMENT PLAN

${report.follow_up_questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

EXTENDED CLINICAL REPORT

PATIENT SUMMARY
${report.extended_report.patient_summary}

HISTORY OF PRESENTING ILLNESS
${report.extended_report.history_of_presenting_illness}

SYMPTOM CATEGORIZATION

Physical Symptoms:
${report.extended_report.symptom_categorization.physical?.map(s => `- ${s}`).join('\n') || 'None documented'}

Emotional Symptoms:
${report.extended_report.symptom_categorization.emotional?.map(s => `- ${s}`).join('\n') || 'None documented'}

Cognitive Symptoms:
${report.extended_report.symptom_categorization.cognitive?.map(s => `- ${s}`).join('\n') || 'None documented'}

RECOMMENDED CLINICAL FOLLOW-UP
${report.extended_report.recommended_clinical_follow_up?.map(s => `- ${s}`).join('\n') || 'None documented'}

---
Confidential Clinical Document`;

    navigator.clipboard.writeText(textContent);
    toast({
      title: 'Copied',
      description: 'Report copied to clipboard.',
    });
  };

  return (
    <>
      <Head>
        <title>Clinical Report Generator</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 light:from-slate-100 light:via-white light:to-slate-100">
        <DashboardHeader profile={profile} />

        <main className="container mx-auto px-4 py-8 pb-24">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/doctor')}
              className="text-white/70 hover:text-white"
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Clinical Report Generator</h1>
              <p className="text-white/60">Generate comprehensive clinical reports from intake text</p>
            </div>
          </div>

          {currentStep === 'input' && (
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-teal-400" />
                  Patient Intake Text
                </CardTitle>
                <CardDescription className="text-white/60">
                  Paste the patient intake notes, session transcripts, or clinical observations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="intake-text" className="text-white/80">Intake Text</Label>
                  <Textarea
                    id="intake-text"
                    placeholder="Enter patient intake information here. Include presenting problems, symptoms, history, and any relevant clinical observations..."
                    value={intakeText}
                    onChange={(e) => setIntakeText(e.target.value)}
                    className="min-h-[300px] bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-teal-400/50"
                    data-testid="input-intake-text"
                  />
                </div>

                <Button
                  onClick={handleGenerateReport}
                  disabled={isGenerating || !intakeText.trim()}
                  className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white shadow-lg shadow-teal-500/25"
                  data-testid="button-generate-report"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Clinical Report
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {currentStep === 'report' && report && (
            <div className="space-y-6">
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('input')}
                  className="border-white/20 text-white hover:bg-white/10"
                  data-testid="button-new-report"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  New Report
                </Button>
                <Button
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white"
                  data-testid="button-download-pdf"
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopyReport}
                  className="border-white/20 text-white hover:bg-white/10"
                  data-testid="button-copy-report"
                >
                  <FileCheck className="mr-2 h-4 w-4" />
                  Copy to Clipboard
                </Button>
              </div>

              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-teal-400" />
                    Clinical Intake Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/80 leading-relaxed" data-testid="text-clinical-summary">
                    {report.clinical_summary}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-amber-400" />
                    Required Follow-Up for Treatment Plan
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    Questions to gather missing information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3" data-testid="list-follow-up-questions">
                    {report.follow_up_questions.map((question, index) => (
                      <li key={index} className="flex gap-3 text-white/80">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-sm flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span>{question}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-400" />
                    Extended Clinical Report
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-2">Patient Summary</h4>
                    <p className="text-white/80 leading-relaxed" data-testid="text-patient-summary">
                      {report.extended_report.patient_summary}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-2">History of Presenting Illness</h4>
                    <p className="text-white/80 leading-relaxed" data-testid="text-hpi">
                      {report.extended_report.history_of_presenting_illness}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-2">Symptom Categorization</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white/5 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-red-400 mb-2">Physical</h5>
                        <ul className="space-y-1" data-testid="list-physical-symptoms">
                          {report.extended_report.symptom_categorization.physical?.map((symptom, i) => (
                            <li key={i} className="text-white/70 text-sm">• {symptom}</li>
                          )) || <li className="text-white/40 text-sm">None documented</li>}
                        </ul>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-purple-400 mb-2">Emotional</h5>
                        <ul className="space-y-1" data-testid="list-emotional-symptoms">
                          {report.extended_report.symptom_categorization.emotional?.map((symptom, i) => (
                            <li key={i} className="text-white/70 text-sm">• {symptom}</li>
                          )) || <li className="text-white/40 text-sm">None documented</li>}
                        </ul>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-cyan-400 mb-2">Cognitive</h5>
                        <ul className="space-y-1" data-testid="list-cognitive-symptoms">
                          {report.extended_report.symptom_categorization.cognitive?.map((symptom, i) => (
                            <li key={i} className="text-white/70 text-sm">• {symptom}</li>
                          )) || <li className="text-white/40 text-sm">None documented</li>}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-2">Recommended Clinical Follow-Up</h4>
                    <ul className="space-y-2" data-testid="list-follow-up">
                      {report.extended_report.recommended_clinical_follow_up?.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-white/80">
                          <span className="text-teal-400">→</span>
                          <span>{step}</span>
                        </li>
                      )) || <li className="text-white/40">None documented</li>}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export const getServerSideProps = requireDoctor;
