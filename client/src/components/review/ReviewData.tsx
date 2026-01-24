import React from 'react';

interface ReviewDataProps {
    onProceed: () => void;
    onBack: () => void;
}

export const ReviewData: React.FC<ReviewDataProps> = ({ onProceed, onBack }) => {
    return (
        <main className="flex-1 px-4 space-y-6 overflow-y-auto hide-scrollbar pb-32 pt-12">
            <section className="glass-panel dark:bg-surface-dark rounded-3xl p-6 relative overflow-hidden text-center">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10 flex flex-col items-center">
                     <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center shadow-lg relative mb-4">
                        <span className="material-symbols-outlined text-amber-500 text-3xl">fact_check</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Clinical Readiness Check</h2>
                    <p className="text-slate-500 dark:text-gray-400 text-sm">Review missing details.</p>
                </div>
            </section>
             <div className="pt-4 pb-8 flex flex-col gap-3">
                <button
                    className="w-full relative group overflow-hidden rounded-xl p-[1px] shadow-glow transform active:scale-95 transition-all duration-200 cursor-pointer"
                    onClick={onProceed}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-teal-300 to-primary animate-gradient-xy opacity-80 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative bg-white dark:bg-gray-900 rounded-xl px-6 py-4 flex items-center justify-center gap-2 group-hover:bg-gray-50 dark:group-hover:bg-gray-800 transition-colors">
                        <span className="material-symbols-outlined text-primary animate-pulse">check_circle</span>
                        <span className="text-slate-900 dark:text-white font-semibold tracking-wide">Proceed to Generation</span>
                    </div>
                </button>
                <button
                    className="w-full py-2 text-sm font-medium text-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    onClick={onBack}
                >
                    <span className="material-symbols-outlined text-xs">arrow_back</span>
                    <span>Go Back</span>
                </button>
            </div>
        </main>
    );
};
