import React from 'react';
import { useLocation } from 'wouter';

export const RecentNotes: React.FC = () => {
    const [, setLocation] = useLocation();

    return (
        <>
            <section className="flex flex-col px-6 pb-2 pt-6">
                <h3 className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">Recent Notes</h3>
            </section>
            <section className="flex flex-col gap-3 px-6 pb-8">
                 <button type="button" onClick={() => setLocation("/generator")} className="group flex w-full items-center justify-between p-4 rounded-2xl bg-white/40 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/60 dark:hover:border-white/10 text-left">
                    <div className="flex items-center gap-4">
                        <div className="relative flex items-center justify-center size-12 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <span className="material-symbols-outlined">description</span>
                            <div className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-white dark:bg-background-dark border border-slate-100 dark:border-white/10 shadow-sm">
                                <span className="material-symbols-outlined text-[10px] text-teal-500">mic</span>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <p className="text-slate-900 dark:text-white text-sm font-bold">Patient J.D.</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-slate-500 dark:text-white/50 text-xs font-medium">Initial Eval</span>
                                <span className="size-1 rounded-full bg-slate-300 dark:bg-white/30"></span>
                                <span className="text-slate-400 dark:text-white/40 text-xs">10:30 AM</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="hidden sm:block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-100 dark:border-transparent">Finalized</span>
                        <span className="material-symbols-outlined text-slate-300 dark:text-white/30 group-hover:text-slate-400">chevron_right</span>
                    </div>
                </button>

                <button type="button" onClick={() => setLocation("/patients")} className="group flex w-full items-center justify-between p-4 rounded-2xl bg-white/40 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/60 dark:hover:border-white/10 text-left">
                    <div className="flex items-center gap-4">
                        <div className="relative flex items-center justify-center size-12 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            <span className="material-symbols-outlined">psychology</span>
                        </div>
                        <div className="flex flex-col">
                            <p className="text-slate-900 dark:text-white text-sm font-bold">Patient A.M.</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-slate-500 dark:text-white/50 text-xs font-medium">Follow-up</span>
                                <span className="size-1 rounded-full bg-slate-300 dark:bg-white/30"></span>
                                <span className="text-slate-400 dark:text-white/40 text-xs">09:15 AM</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-transparent">
                            <div className="size-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse"></div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Processing</span>
                        </div>
                        <span className="material-symbols-outlined text-slate-300 dark:text-white/30 group-hover:text-slate-400">chevron_right</span>
                    </div>
                </button>

                <button type="button" onClick={() => setLocation("/medication")} className="group flex w-full items-center justify-between p-4 rounded-2xl bg-white/40 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/60 dark:hover:border-white/10 text-left">
                    <div className="flex items-center gap-4">
                        <div className="relative flex items-center justify-center size-12 rounded-full bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400">
                            <span className="material-symbols-outlined">medication</span>
                        </div>
                        <div className="flex flex-col">
                            <p className="text-slate-900 dark:text-white text-sm font-bold">Patient S.L.</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-slate-500 dark:text-white/50 text-xs font-medium">Med Mgmt</span>
                                <span className="size-1 rounded-full bg-slate-300 dark:bg-white/30"></span>
                                <span className="text-slate-400 dark:text-white/40 text-xs">Yesterday</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="hidden sm:block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/40 border border-slate-200 dark:border-transparent">Draft</span>
                        <span className="material-symbols-outlined text-slate-300 dark:text-white/30 group-hover:text-slate-400">chevron_right</span>
                    </div>
                </button>
            </section>
        </>
    );
};
