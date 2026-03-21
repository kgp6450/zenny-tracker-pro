import { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Plus, Receipt, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/hooks/useHapticFeedback';

interface BottomNavProps {
  activeTab: 'dashboard' | 'add' | 'history' | 'settings';
  onTabChange: (tab: 'dashboard' | 'add' | 'history' | 'settings') => void;
  onAddPress: () => void;
}

const tabs = [
  { id: 'dashboard' as const, icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'history' as const, icon: Receipt, label: 'History' },
  // FAB placeholder
  { id: 'add' as const, icon: Plus, label: 'Add' },
  { id: 'settings' as const, icon: Settings, label: 'Settings' },
] as const;

const navTabs = tabs.filter(t => t.id !== 'add');

export const BottomNav = ({ activeTab, onTabChange, onAddPress }: BottomNavProps) => {
  const navRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (!navRef.current) return;
    const activeBtn = navRef.current.querySelector(`[data-tab="${activeTab}"]`) as HTMLElement;
    if (activeBtn) {
      const navRect = navRef.current.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      setIndicatorStyle({
        left: btnRect.left - navRect.left + btnRect.width / 2 - 12,
        width: 24,
      });
    }
  }, [activeTab]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div ref={navRef} className="relative flex items-center justify-around px-4 h-16 max-w-lg mx-auto">
        {/* Animated pill indicator */}
        <div
          className="absolute top-0 h-[3px] rounded-full bg-primary transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
        />

        {/* Dashboard */}
        <button
          data-tab="dashboard"
          onClick={() => {
            haptic.light();
            onTabChange('dashboard');
          }}
          className={cn(
            "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-200 press-effect",
            activeTab === 'dashboard' 
              ? "text-primary" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <LayoutDashboard className={cn("w-5 h-5 transition-transform duration-300", activeTab === 'dashboard' && "scale-110")} />
          <span className={cn("text-[10px] font-medium transition-all duration-300", activeTab === 'dashboard' ? "opacity-100" : "opacity-70")}>Dashboard</span>
        </button>

        {/* History */}
        <button
          data-tab="history"
          onClick={() => {
            haptic.light();
            onTabChange('history');
          }}
          className={cn(
            "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-200 press-effect",
            activeTab === 'history' 
              ? "text-primary" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Receipt className={cn("w-5 h-5 transition-transform duration-300", activeTab === 'history' && "scale-110")} />
          <span className={cn("text-[10px] font-medium transition-all duration-300", activeTab === 'history' ? "opacity-100" : "opacity-70")}>History</span>
        </button>

        {/* Add - Center FAB */}
        <button
          onClick={() => {
            haptic.medium();
            onAddPress();
          }}
          className="relative -mt-8 flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 transform-gpu hover:scale-105 active:scale-95 fab-button"
          style={{
            background: 'var(--gradient-primary)',
            boxShadow: 'var(--shadow-md), 0 0 24px hsl(var(--primary) / 0.25)',
          }}
          aria-label="Add expense"
        >
          <Plus className="w-6 h-6 text-primary-foreground" />
        </button>

        {/* Settings */}
        <button
          data-tab="settings"
          onClick={() => {
            haptic.light();
            onTabChange('settings');
          }}
          className={cn(
            "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-200 press-effect",
            activeTab === 'settings' 
              ? "text-primary" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Settings className={cn("w-5 h-5 transition-transform duration-300", activeTab === 'settings' && "scale-110")} />
          <span className={cn("text-[10px] font-medium transition-all duration-300", activeTab === 'settings' ? "opacity-100" : "opacity-70")}>Settings</span>
        </button>
      </div>
    </nav>
  );
};
