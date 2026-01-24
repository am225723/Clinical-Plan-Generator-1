import React from 'react';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { useToast } from '@/hooks/use-toast';

interface DashboardHeaderProps {
    onSignIn?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onSignIn }) => {
    const { user, signOut } = useSupabaseAuth();
    const { toast } = useToast();

    // Toggle Theme function
    const toggleTheme = () => {
        document.documentElement.classList.toggle('dark');
    };

    const handleSignOut = async () => {
        const { error } = await signOut();
        if (error) {
            toast({ title: "Sign Out Failed", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Signed Out", description: "You have been signed out." });
        }
    };

    return (
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-5 bg-background/90 dark:bg-background/90 backdrop-blur-xl border-b border-white/40 dark:border-white/5 transition-colors print:hidden">
            <div className="flex items-center gap-3" onClick={user ? undefined : onSignIn}>
                <div className="relative group cursor-pointer">
                    <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-11 ring-2 ring-white dark:ring-white/10 shadow-sm bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xl">
                        {user?.email?.charAt(0).toUpperCase() || '?'}
                    </div>
                    {user && <div className="absolute bottom-0 right-0 size-3.5 bg-primary rounded-full border-[3px] border-background dark:border-background"></div>}
                </div>
                <div className="flex flex-col cursor-pointer">
                    <h2 className="text-slate-500 dark:text-white/60 text-xs font-semibold uppercase tracking-wider">{user ? 'Welcome back' : 'Guest'}</h2>
                    <h1 className="text-slate-900 dark:text-white text-base font-bold leading-tight">{user?.email?.split('@')[0] || 'Sign In'}</h1>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button className="relative flex items-center justify-center size-10 rounded-full bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 shadow-sm border border-white/60 dark:border-white/5 transition-all active:scale-95 cursor-pointer" onClick={toggleTheme}>
                    <span className="material-symbols-outlined text-slate-600 dark:text-white" style={{fontSize: '20px'}}>dark_mode</span>
                </button>
                {user && (
                    <button onClick={handleSignOut} className="relative flex items-center justify-center size-10 rounded-full bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 shadow-sm border border-white/60 dark:border-white/5 transition-all active:scale-95 cursor-pointer" title="Sign Out">
                        <span className="material-symbols-outlined text-slate-600 dark:text-white" style={{fontSize: '20px'}}>logout</span>
                    </button>
                )}
            </div>
        </header>
    );
};
