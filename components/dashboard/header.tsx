import { useRouter } from 'next/router';
import { Bell, Moon, Sun, Settings, LogOut } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { Profile } from '@/lib/supabase';

interface DashboardHeaderProps {
  profile: Profile;
  onSignOut: () => void;
}

export function DashboardHeader({ profile, onSignOut }: DashboardHeaderProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  
  const firstName = profile.full_name?.split(' ')[0] || 'Doctor';
  const initials = profile.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'DR';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-5 bg-background/90 backdrop-blur-xl border-b border-border transition-colors">
      <div className="flex items-center gap-3">
        <div className="relative group cursor-pointer">
          <div className="bg-primary/10 rounded-full size-11 ring-2 ring-card shadow-sm flex items-center justify-center text-primary font-bold text-sm">
            {initials}
          </div>
          <div className="absolute bottom-0 right-0 size-3.5 bg-primary rounded-full border-[3px] border-background" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            Welcome back
          </h2>
          <h1 className="text-foreground text-base font-bold leading-tight">
            {profile.full_name?.includes('Dr.') ? profile.full_name : `Dr. ${firstName}`}
          </h1>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="relative flex items-center justify-center size-10 rounded-full bg-card/70 dark:bg-card/50 hover:bg-card shadow-sm border border-border transition-all active:scale-95"
          data-testid="button-theme-toggle"
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Sun className="h-5 w-5 text-foreground" />
          )}
        </button>
        
        <button 
          onClick={() => router.push('/settings')}
          className="relative flex items-center justify-center size-10 rounded-full bg-card/70 dark:bg-card/50 hover:bg-card shadow-sm border border-border transition-all active:scale-95"
          data-testid="button-settings"
        >
          <Settings className="h-5 w-5 text-muted-foreground" />
        </button>
        
        <button 
          onClick={onSignOut}
          className="relative flex items-center justify-center size-10 rounded-full bg-card/70 dark:bg-card/50 hover:bg-card shadow-sm border border-border transition-all active:scale-95"
          data-testid="button-signout"
        >
          <LogOut className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
