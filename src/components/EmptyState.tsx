import { Sparkles, Plus, ArrowDown } from 'lucide-react';

export const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in">
      {/* Illustration */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center animate-pulse-glow">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
          <Plus className="w-3 h-3 text-accent-foreground" />
        </div>
      </div>

      <h3 className="font-display text-xl font-bold text-foreground mb-2">
        Ready to track your first expense?
      </h3>
      <p className="text-muted-foreground text-sm max-w-[260px] mb-8 leading-relaxed">
        Start by tapping the <span className="text-primary font-semibold">+</span> button below to add your first expense. We'll help you stay on top of your spending.
      </p>

      {/* Bouncing arrow pointing to FAB */}
      <div className="animate-bounce text-muted-foreground/50">
        <ArrowDown className="w-5 h-5" />
      </div>
    </div>
  );
};
