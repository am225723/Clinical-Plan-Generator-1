import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export const TemplateConfig: React.FC = () => {
    const { toast } = useToast();
    const [systemPrompt, setSystemPrompt] = useState("");

    useEffect(() => {
        const saved = localStorage.getItem('clinical-system-prompt');
        if (saved) {
            setSystemPrompt(saved);
        } else {
            setSystemPrompt(`You are a Senior Clinical Psychiatrist performing an Initial Evaluation.
Your goal is to synthesize patient intake data into a structured clinical narrative.
Focus Areas:
1. Presenting Problem & History of Present Illness.
2. Mental Status Exam observations.
3. Risk Assessment formulation.`);
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem('clinical-system-prompt', systemPrompt);
        toast({
            title: "Configuration Saved",
            description: "System prompt updated.",
        });
    };

    return (
        <main className="flex-1 px-5 pb-40 space-y-8 overflow-y-auto custom-scroll hide-scrollbar pt-6">
            <section>
                <div className="flex items-center justify-between mb-3 px-1">
                    <h2 className="text-sm font-medium text-slate-500 dark:text-gray-400">Template Selection</h2>
                </div>
                <div className="flex space-x-3 overflow-x-auto pb-1 -mx-5 px-5 hide-scrollbar snap-x">
                    <button className="snap-center shrink-0 bg-primary/10 border border-primary text-primary px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap shadow-glow transition-all ring-1 ring-primary/20 cursor-pointer">
                        Initial Eval
                    </button>
                    <button className="snap-center shrink-0 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer">
                        SOAP Note
                    </button>
                    <button className="snap-center shrink-0 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer">
                        Discharge Summary
                    </button>
                    <button className="snap-center shrink-0 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer">
                        Treatment Plan
                    </button>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex items-center space-x-2">
                    <span className="material-symbols-outlined text-primary text-xl">psychology</span>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">AI Logic for Initial Eval</h2>
                </div>
                <div className="relative group">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 mb-2 ml-1 tracking-wide uppercase" htmlFor="system-prompt">
                        System Prompt
                    </label>
                    <div className="relative">
                        <textarea
                            className="w-full h-48 bg-white/50 dark:bg-white/[0.03] backdrop-blur-md rounded-2xl border border-slate-200 dark:border-white/10 p-5 font-display text-[15px] leading-relaxed text-slate-900 dark:text-gray-200 placeholder-gray-400/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all resize-none shadow-sm selection:bg-primary/20"
                            id="system-prompt"
                            spellCheck={false}
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                        />
                         <div className="absolute bottom-3 right-3 flex items-center space-x-2 pointer-events-none">
                            <span className="text-[10px] text-slate-500 dark:text-white/20 bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-md backdrop-blur-sm border border-transparent dark:border-white/5">
                                v3.0 (GPT-4o)
                            </span>
                        </div>
                    </div>
                </div>
            </section>

             <div className="fixed bottom-24 left-0 right-0 px-5 z-40 pointer-events-none flex justify-center max-w-md mx-auto">
                <button
                    onClick={handleSave}
                    className="w-full bg-primary hover:bg-teal-300 text-white font-bold tracking-tight py-3.5 rounded-xl shadow-glow transition-all active:scale-[0.98] pointer-events-auto flex items-center justify-center space-x-2 border border-teal-300/50 cursor-pointer"
                >
                    <span className="material-symbols-outlined">save</span>
                    <span>Save Configuration</span>
                </button>
            </div>
        </main>
    );
};
