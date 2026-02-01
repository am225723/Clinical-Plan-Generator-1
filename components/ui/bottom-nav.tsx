import { useRouter } from 'next/router';
import { Home, FileText, History, Settings, Sparkles, Users, ClipboardList } from 'lucide-react';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  tab?: string;
}

interface BottomNavProps {
  onGenerateClick?: () => void;
}

export function BottomNav({ onGenerateClick }: BottomNavProps) {
  const router = useRouter();
  
  const leftNavItems: NavItem[] = [
    { icon: <Home className="h-6 w-6" />, label: 'Home', href: '/doctor', tab: 'dashboard' },
    { icon: <ClipboardList className="h-6 w-6" />, label: 'Report', href: '/clinical-report' },
  ];

  const rightNavItems: NavItem[] = [
    { icon: <Users className="h-6 w-6" />, label: 'Patients', href: '/patients' },
    { icon: <History className="h-6 w-6" />, label: 'History', href: '/doctor', tab: 'history' },
    { icon: <Settings className="h-6 w-6" />, label: 'Settings', href: '/settings' },
  ];

  const isActive = (item: NavItem) => {
    if (item.tab) {
      return router.pathname === item.href && (router.query.tab === item.tab || (!router.query.tab && item.tab === 'dashboard'));
    }
    return router.pathname === item.href && !router.query.tab;
  };

  const handleNavigate = (item: NavItem) => {
    if (item.tab) {
      router.push(`${item.href}?tab=${item.tab}`, undefined, { shallow: true });
    } else {
      router.push(item.href);
    }
  };

  const handleGenerateClick = () => {
    if (onGenerateClick) {
      onGenerateClick();
    } else {
      router.push('/doctor?tab=generate', undefined, { shallow: true });
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 print:hidden">
      <div className="bg-background/95 dark:bg-[#0B1215]/95 backdrop-blur-xl border-t border-border/50 pb-6 pt-2 px-4">
        <div className="max-w-md mx-auto flex justify-between items-center">
          {leftNavItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleNavigate(item)}
              className={`flex flex-col items-center gap-1 w-14 group transition-colors ${
                isActive(item) 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-primary'
              }`}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
          
          <div className="relative -top-6">
            <button 
              onClick={handleGenerateClick}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-[#13ecc8] to-[#0d9488] text-white flex items-center justify-center shadow-[0_0_20px_rgba(19,236,200,0.4)] hover:scale-110 hover:-translate-y-1 transition-all duration-300 ring-4 ring-background dark:ring-[#0B1215]"
              data-testid="nav-generate"
            >
              <Sparkles className="h-6 w-6" />
            </button>
          </div>
          
          {rightNavItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleNavigate(item)}
              className={`flex flex-col items-center gap-1 w-14 group transition-colors ${
                isActive(item) 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-primary'
              }`}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
