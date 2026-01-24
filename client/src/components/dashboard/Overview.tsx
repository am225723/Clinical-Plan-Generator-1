import React from 'react';

export const Overview: React.FC = () => {
    return (
        <section className="flex flex-col gap-4 px-6 pt-6">
            <div className="flex items-baseline justify-between">
                <h3 className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">Practice Overview</h3>
                <span className="text-teal-600 dark:text-primary text-sm font-semibold cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1">
                    View Report
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
            </div>
            <div className="flex overflow-x-auto gap-4 hide-scrollbar -mx-6 px-6 pb-6 pt-1">
                <div className="glass-panel min-w-[160px] flex-1 flex flex-col gap-4 rounded-2xl p-5 group transition-all hover:-translate-y-1">
                    <div className="flex justify-between items-start">
                        <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-primary/10 text-teal-600 dark:text-primary">
                            <span className="material-symbols-outlined" style={{fontSize: '22px'}}>timer</span>
                        </div>
                        <span className="text-teal-700 dark:text-primary text-[11px] font-bold bg-teal-100/50 dark:bg-primary/10 px-2 py-1 rounded-lg">+4h</span>
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-white/60 text-[11px] font-semibold uppercase tracking-wide">Time Saved</p>
                        <p className="text-slate-900 dark:text-white text-2xl font-bold mt-1">16.5 <span className="text-sm font-medium text-slate-400 dark:text-white/40">hrs</span></p>
                    </div>
                </div>
                <div className="glass-panel min-w-[160px] flex-1 flex flex-col gap-4 rounded-2xl p-5 group transition-all hover:-translate-y-1">
                    <div className="flex justify-between items-start">
                        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400">
                            <span className="material-symbols-outlined" style={{fontSize: '22px'}}>flag</span>
                        </div>
                        <span className="text-rose-600 dark:text-rose-400 text-[11px] font-bold bg-rose-100/50 dark:bg-rose-500/10 px-2 py-1 rounded-lg">Action Req</span>
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-white/60 text-[11px] font-semibold uppercase tracking-wide">Risk Flagged</p>
                        <p className="text-slate-900 dark:text-white text-2xl font-bold mt-1">5 <span className="text-sm font-medium text-slate-400 dark:text-white/40">Cases</span></p>
                    </div>
                </div>
                <div className="glass-panel min-w-[160px] flex-1 flex flex-col gap-4 rounded-2xl p-5 group transition-all hover:-translate-y-1">
                    <div className="flex justify-between items-start">
                        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                            <span className="material-symbols-outlined" style={{fontSize: '22px'}}>verified_user</span>
                        </div>
                        <span className="text-indigo-600 dark:text-primary text-[11px] font-bold bg-indigo-100/50 dark:bg-primary/10 px-2 py-1 rounded-lg">Perfect</span>
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-white/60 text-[11px] font-semibold uppercase tracking-wide">Compliance</p>
                        <p className="text-slate-900 dark:text-white text-2xl font-bold mt-1">99.2<span className="text-sm font-medium text-slate-400 dark:text-white/40">%</span></p>
                    </div>
                </div>
            </div>
        </section>
    );
};
