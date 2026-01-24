import React from 'react';

export const Calendar: React.FC = () => {
    return (
        <section className="px-6 py-2">
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">Clinical Calendar</h3>
                <button className="glass-panel flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white dark:hover:bg-white/10 transition-colors group border-white/60 dark:border-white/10 shadow-sm cursor-pointer">
                    <span className="material-symbols-outlined text-teal-500 dark:text-primary text-lg group-hover:scale-110 transition-transform">calendar_add_on</span>
                    <span className="text-xs font-semibold text-slate-600 dark:text-white/80 group-hover:text-slate-900 dark:group-hover:text-white">Import iCal</span>
                </button>
            </div>
            <div className="flex flex-col gap-3">
                <div className="glass-panel p-4 rounded-2xl flex items-center gap-5 hover:bg-white/90 dark:hover:bg-white/5 transition-colors cursor-pointer border border-white/60 dark:border-white/5">
                    <div className="flex flex-col items-center justify-center min-w-[3.5rem] pr-5 border-r border-slate-200/60 dark:border-white/10">
                        <span className="text-slate-900 dark:text-white font-bold text-lg">09:00</span>
                        <span className="text-slate-400 dark:text-white/40 text-[10px] uppercase font-bold tracking-wider">AM</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                        <h4 className="text-slate-900 dark:text-white font-bold text-sm">Sarah Jenkins</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-slate-500 dark:text-white/50 text-xs font-medium">Initial Evaluation</span>
                            <span className="size-1 rounded-full bg-slate-300 dark:bg-white/30"></span>
                            <span className="text-slate-500 dark:text-white/50 text-xs">Room 204</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-center size-8 rounded-full bg-teal-50 dark:bg-primary/10 text-teal-500 dark:text-primary" title="Completed">
                        <span className="material-symbols-outlined text-xl">check_circle</span>
                    </div>
                </div>
                <div className="glass-panel p-4 rounded-2xl flex items-center gap-5 hover:bg-white/90 dark:hover:bg-white/5 transition-colors cursor-pointer border border-white/60 dark:border-white/5 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500"></div>
                    <div className="flex flex-col items-center justify-center min-w-[3.5rem] pr-5 border-r border-slate-200/60 dark:border-white/10 ml-1.5">
                        <span className="text-slate-900 dark:text-white font-bold text-lg">10:30</span>
                        <span className="text-slate-400 dark:text-white/40 text-[10px] uppercase font-bold tracking-wider">AM</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                        <h4 className="text-slate-900 dark:text-white font-bold text-sm">Michael Barnes</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-slate-500 dark:text-white/50 text-xs font-medium">Medication Mgmt</span>
                            <span className="size-1 rounded-full bg-slate-300 dark:bg-white/30"></span>
                            <span className="text-slate-500 dark:text-white/50 text-xs">Virtual</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-center px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Note Pending</span>
                    </div>
                </div>
                <div className="glass-panel p-4 rounded-2xl flex items-center gap-5 hover:bg-white/90 dark:hover:bg-white/5 transition-colors cursor-pointer border border-white/60 dark:border-white/5">
                    <div className="flex flex-col items-center justify-center min-w-[3.5rem] pr-5 border-r border-slate-200/60 dark:border-white/10">
                        <span className="text-slate-900 dark:text-white font-bold text-lg">01:00</span>
                        <span className="text-slate-400 dark:text-white/40 text-[10px] uppercase font-bold tracking-wider">PM</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                        <h4 className="text-slate-900 dark:text-white font-bold text-sm">Emma Roberts</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-slate-500 dark:text-white/50 text-xs font-medium">Therapy Session</span>
                            <span className="size-1 rounded-full bg-slate-300 dark:bg-white/30"></span>
                            <span className="text-slate-500 dark:text-white/50 text-xs">Room 204</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-center size-8 rounded-full bg-teal-50 dark:bg-primary/10 text-teal-500 dark:text-primary" title="Completed">
                        <span className="material-symbols-outlined text-xl">check_circle</span>
                    </div>
                </div>
            </div>
        </section>
    );
};
