import React, { useRef } from 'react';
import { ClinicalInputs } from '@/lib/clinical-generator';
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface GeneratorFormProps {
    inputs: ClinicalInputs;
    setInputs: React.Dispatch<React.SetStateAction<ClinicalInputs>>;
    onGenerate: () => void;
    isGenerating: boolean;
}

export const GeneratorForm: React.FC<GeneratorFormProps> = ({ inputs, setInputs, onGenerate, isGenerating }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (field: keyof ClinicalInputs, value: any) => {
        setInputs(prev => ({ ...prev, [field]: value }));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            try {
                if (file.type === 'application/pdf') {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    let fullText = "";
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map((item: any) => item.str).join(' ');
                        fullText += pageText + "\n";
                    }
                    handleInputChange('intake_form_data', (inputs.intake_form_data || '') + "\n\n[Attached PDF Content: " + file.name + "]\n" + fullText);
                } else {
                    const text = await file.text();
                    // Append to intake_form_data or session_transcripts depending on context, defaulting to intake
                    handleInputChange('intake_form_data', (inputs.intake_form_data || '') + "\n\n[Attached File Content: " + file.name + "]\n" + text);
                }
            } catch (err) {
                console.error("Error reading file", err);
            }
        }
    };

    return (
        <div className="flex-1 px-4 space-y-5 overflow-y-auto hide-scrollbar pb-32 pt-6">
            <section className="glass-panel rounded-3xl p-5 shadow-glass relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex justify-between items-center mb-5 border-b border-gray-200 dark:border-gray-700/50 pb-3">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">edit_note</span>
                        Patient Information
                    </h2>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                    <div className="col-span-1">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Client ID</label>
                        <div className="relative">
                            <input
                                className="w-full bg-white/50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700/50 rounded-xl px-3 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder-gray-400 dark:placeholder-gray-600 transition-all shadow-inner font-mono tracking-wide"
                                placeholder="Enter ID"
                                type="text"
                                value={inputs.client_id}
                                onChange={(e) => handleInputChange('client_id', e.target.value)}
                            />
                        </div>
                    </div>
                     <div className="col-span-1">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Date of Service</label>
                        <div className="relative">
                            <input
                                className="w-full bg-white/50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700/50 rounded-xl px-3 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder-gray-400 dark:placeholder-gray-600 transition-all shadow-inner [color-scheme:light] dark:[color-scheme:dark]"
                                type="date"
                                value={inputs.date_of_service}
                                onChange={(e) => handleInputChange('date_of_service', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div className="glass-panel rounded-3xl p-5 shadow-glass border-t border-white/5">
                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Add Evidence Source</h4>
                    <div className="grid grid-cols-4 gap-3 mb-5">
                        <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-gray-100 dark:bg-gray-800/40 hover:bg-primary/10 hover:border-primary/30 border border-transparent transition-all group aspect-square cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <span className="material-symbols-outlined text-primary text-2xl group-hover:scale-110 transition-transform">upload_file</span>
                            <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">File</span>
                        </button>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />

                    <div className="space-y-4">
                         <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Intake Data / Notes</label>
                            <textarea
                                className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/50 rounded-2xl p-4 text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none h-32 transition-shadow leading-relaxed"
                                placeholder="Paste intake form data or clinical notes..."
                                value={inputs.intake_form_data}
                                onChange={(e) => handleInputChange('intake_form_data', e.target.value)}
                            ></textarea>
                         </div>
                         <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Session Transcript</label>
                            <textarea
                                className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/50 rounded-2xl p-4 text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none h-32 transition-shadow leading-relaxed"
                                placeholder="Paste session transcript..."
                                value={inputs.session_transcripts}
                                onChange={(e) => handleInputChange('session_transcripts', e.target.value)}
                            ></textarea>
                         </div>
                         <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Assessment Scores</label>
                            <textarea
                                className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/50 rounded-2xl p-4 text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none h-24 transition-shadow leading-relaxed"
                                placeholder="GAD-7: 15, PHQ-9: 10..."
                                value={inputs.assessment_scores}
                                onChange={(e) => handleInputChange('assessment_scores', e.target.value)}
                            ></textarea>
                         </div>
                         <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Provider Notes / MSE</label>
                            <textarea
                                className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/50 rounded-2xl p-4 text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none h-24 transition-shadow leading-relaxed"
                                placeholder="MSE observations, specific plan details..."
                                value={inputs.provider_notes}
                                onChange={(e) => handleInputChange('provider_notes', e.target.value)}
                            ></textarea>
                         </div>
                    </div>
                </div>
            </section>

            <section className="glass-panel rounded-3xl p-5 shadow-glass border-t border-white/5 space-y-4">
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Configuration</h4>

                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Privacy Mode (Redact ID)</label>
                    <input
                        type="checkbox"
                        checked={inputs.privacy_mode}
                        onChange={(e) => handleInputChange('privacy_mode', e.target.checked)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Use Image Signature</label>
                         <input
                            type="checkbox"
                            checked={inputs.use_image_signature}
                            onChange={(e) => handleInputChange('use_image_signature', e.target.checked)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                    </div>
                    {inputs.use_image_signature && (
                        <input
                            className="w-full bg-white/50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700/50 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400"
                            placeholder="Signature URL"
                            value={inputs.provider_signature_url}
                            onChange={(e) => handleInputChange('provider_signature_url', e.target.value)}
                        />
                    )}
                </div>
            </section>

             <div className="fixed bottom-24 left-0 right-0 px-6 z-30 pointer-events-none flex justify-center max-w-md mx-auto">
                <button
                    className="pointer-events-auto w-full relative group overflow-hidden rounded-2xl p-[1px] shadow-glow hover:shadow-[0_0_30px_rgba(45,212,191,0.6)] transition-all duration-500 transform hover:-translate-y-1 cursor-pointer"
                    onClick={onGenerate}
                    disabled={isGenerating}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-teal-200 to-primary animate-gradient-xy opacity-80 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative bg-white dark:bg-gray-900 rounded-2xl px-6 py-4 flex items-center justify-center gap-3 group-hover:bg-gray-50 dark:group-hover:bg-gray-800 transition-colors">
                        {isGenerating ? (
                             <span className="material-symbols-outlined text-primary animate-spin">refresh</span>
                        ) : (
                             <span className="material-symbols-outlined text-primary animate-pulse">auto_awesome</span>
                        )}
                        <span className="text-slate-900 dark:text-white font-bold tracking-wide text-sm">{isGenerating ? 'Generating...' : 'Generate Treatment Plan'}</span>
                    </div>
                </button>
            </div>
        </div>
    );
};
