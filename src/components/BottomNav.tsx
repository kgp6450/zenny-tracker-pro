import { LayoutDashboard, Plus, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/hooks/useHapticFeedback';

interface BottomNavProps {
  activeTab: 'dashboard' | 'add' | 'history';
  onTabChange: (tab: 'dashboard' | 'add' | 'history') => void;
  onAddPress: () => void;
}

export const BottomNav = ({ activeTab, onTabChange, onAddPress }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around px-4 h-16 max-w-lg mx-auto">
        {/* Dashboard */}
        <button
          onClick={() => {
            haptic.light();
            onTabChange('dashboard');
          }}
          className={cn(
            "flex flex-col items-center gap-1 px-6 py-2 rounded-2xl transition-all duration-200 press-effect",
            activeTab === 'dashboard' 
              ? "text-primary bg-primary/10" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium">Dashboard</span>
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

        {/* History */}
        <button
          onClick={() => {
            haptic.light();
            onTabChange('history');
          }}
          className={cn(
            "flex flex-col items-center gap-1 px-6 py-2 rounded-2xl transition-all duration-200 press-effect",
            activeTab === 'history' 
              ? "text-primary bg-primary/10" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px] font-medium">History</span>
        </button>
      </div>
    </nav>
  );
};
