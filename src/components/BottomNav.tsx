import { useState, useEffect, useRef, useCallback } from 'react';
import { LayoutDashboard, Plus, Receipt, Settings, X, Zap, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/hooks/useHapticFeedback';

interface BottomNavProps {
  activeTab: 'dashboard' | 'add' | 'history' | 'settings';
  onTabChange: (tab: 'dashboard' | 'add' | 'history' | 'settings') => void;
  onAddPress: () => void;
  onAddIncome?: () => void;
}

export const BottomNav = ({ activeTab, onTabChange, onAddPress, onAddIncome }: BottomNavProps) => {
  const navRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [fabOpen, setFabOpen] = useState(false);

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

  const handleFabClick = useCallback(() => {
    haptic.medium();
    setFabOpen(prev => !prev);
  }, []);

  const handleQuickAdd = useCallback(() => {
    haptic.light();
    setFabOpen(false);
    onAddPress();
  }, [onAddPress]);

  const handleAddIncome = useCallback(() => {
    haptic.light();
    setFabOpen(false);
    if (onAddIncome) {
      onAddIncome();
    }
  }, [onAddIncome]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/60 backdrop-blur-sm transition-opacity duration-300",
          fabOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setFabOpen(false)}
      />

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

          {/* Add - Center FAB with morph menu */}
          <div className="relative -mt-8">
            {/* Mini menu items */}
            <div className={cn(
              "absolute bottom-full left-1/2 -translate-x-1/2 mb-3 flex flex-col items-center gap-3 transition-all duration-300",
              fabOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}>
              {/* Add Income */}
              <button
                onClick={handleAddIncome}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border shadow-lg transition-all duration-300 transform-gpu whitespace-nowrap",
                  fabOpen ? "translate-y-0 scale-100" : "translate-y-4 scale-90"
                )}
                style={{ transitionDelay: fabOpen ? '100ms' : '0ms' }}
              >
                <div className="w-10 h-10 rounded-full bg-accent/50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Add Income</span>
              </button>

              {/* Quick Add Expense */}
              <button
                onClick={handleQuickAdd}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border shadow-lg transition-all duration-300 transform-gpu whitespace-nowrap",
                  fabOpen ? "translate-y-0 scale-100" : "translate-y-4 scale-90"
                )}
                style={{ transitionDelay: fabOpen ? '50ms' : '0ms' }}
              >
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Quick Add</span>
              </button>
            </div>

            {/* FAB Button */}
            <button
              onClick={handleFabClick}
              className="relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 transform-gpu hover:scale-105 active:scale-95 fab-button"
              style={{
                background: fabOpen ? 'hsl(var(--muted))' : 'var(--gradient-primary)',
                boxShadow: fabOpen 
                  ? 'var(--shadow-md)' 
                  : 'var(--shadow-md), 0 0 24px hsl(var(--primary) / 0.25)',
              }}
              aria-label={fabOpen ? "Close menu" : "Add expense"}
            >
              <Plus className={cn(
                "w-6 h-6 transition-all duration-300",
                fabOpen ? "rotate-45 text-foreground" : "rotate-0 text-primary-foreground"
              )} />
            </button>
          </div>

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
    </>
  );
};
