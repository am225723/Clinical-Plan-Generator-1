import { useRouter } from 'next/router';
import { Home, FileText, History, Settings, Sparkles } from 'lucide-react';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  tab?: string;
}

export function BottomNav() {
  const router = useRouter();
  
  const navItems: NavItem[] = [
    { icon: <Home className="h-6 w-6" />, label: 'Home', href: '/doctor', tab: 'dashboard' },
    { icon: <FileText className="h-6 w-6" />, label: 'Templates', href: '/settings' },
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-nav pb-6 pt-2 px-6 z-50 print:hidden">
      <div className="max-w-md mx-auto flex justify-between items-center">
        {navItems.slice(0, 2).map((item, index) => (
          <button
            key={index}
            onClick={() => handleNavigate(item)}
            className={`flex flex-col items-center gap-1 w-12 group transition-colors ${
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
            onClick={() => router.push('/doctor?tab=generate', undefined, { shallow: true })}
            className="w-14 h-14 rounded-full btn-gradient text-white flex items-center justify-center shadow-glow hover:scale-110 hover:-translate-y-1 transition-all duration-300 ring-4 ring-background"
            data-testid="nav-generate"
          >
            <Sparkles className="h-6 w-6" />
          </button>
        </div>
        
        {navItems.slice(2).map((item, index) => (
          <button
            key={index + 2}
            onClick={() => handleNavigate(item)}
            className={`flex flex-col items-center gap-1 w-12 group transition-colors ${
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
    </nav>
  );
}
