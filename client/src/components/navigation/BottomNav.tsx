import React from 'react';
import { useLocation } from 'wouter';

export const BottomNav: React.FC = () => {
  const [location, setLocation] = useLocation();

  const navItems = [
    { icon: 'dashboard', label: 'Home', path: '/' },
    { icon: 'article', label: 'Templates', path: '/templates' },
    { icon: 'auto_awesome', label: 'Generator', path: '/generator', isFab: true },
    { icon: 'groups', label: 'Patients', path: '/patients' },
    { icon: 'settings', label: 'Settings', path: '/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full glass-nav pb-6 pt-3 px-6 z-40 print:hidden">
      <div className="flex justify-between items-end max-w-md mx-auto">
        {navItems.map((item) => (
          item.isFab ? (
            <div key={item.path} className="flex flex-col items-center justify-end -mt-10 flex-1 relative group cursor-pointer" onClick={() => setLocation(item.path)}>
               <button className="btn-gradient flex items-center justify-center size-14 rounded-full text-white dark:text-white shadow-lg shadow-teal-500/30 dark:shadow-[0_0_20px_rgba(19,236,200,0.3)] hover:scale-105 transition-all active:scale-95 ring-4 ring-white/50 dark:ring-background-dark/50 cursor-pointer">
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>{item.icon}</span>
              </button>
              <span className={`text-[10px] font-medium mt-1.5 transition-colors ${location === item.path ? 'text-teal-600 dark:text-primary' : 'text-slate-500 dark:text-white/60 group-hover:text-teal-600 dark:group-hover:text-primary'}`}>
                {item.label}
              </span>
            </div>
          ) : (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center gap-1.5 flex-1 group transition-colors ${location === item.path ? 'text-teal-600 dark:text-primary' : 'text-slate-400 dark:text-white/40 hover:text-slate-800 dark:hover:text-white'}`}
            >
              <span className={`material-symbols-outlined ${location === item.path ? 'filled' : ''}`} style={location === item.path ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
              <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
            </button>
          )
        ))}
      </div>
    </nav>
  );
};
