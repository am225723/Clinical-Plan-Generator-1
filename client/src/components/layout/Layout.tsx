import React from 'react';
import { BottomNav } from '../navigation/BottomNav';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden pb-28 bg-background dark:bg-background text-foreground font-display antialiased selection:bg-primary/30 transition-colors duration-300">
      {children}
      <BottomNav />
    </div>
  );
};
