import { useState } from 'react';
import { ArrowLeft, Palette, DollarSign, Target, LogOut, ChevronRight, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings, CURRENCIES, getCurrencySymbol } from '@/hooks/useSettings';
import { haptic } from '@/hooks/useHapticFeedback';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface SettingsPageProps {
  onBack: () => void;
}

export const SettingsPage = ({ onBack }: SettingsPageProps) => {
  const { user, signOut } = useAuth();
  const { settings, updateSettings, currencySymbol } = useSettings();
  const { theme, setTheme } = useTheme();
  const [budgetInput, setBudgetInput] = useState(
    settings.monthly_budget?.toString() || ''
  );

  const handleCurrencyChange = (value: string) => {
    haptic.light();
    updateSettings({ currency: value });
  };

  const handleBudgetSave = () => {
    haptic.light();
    const val = budgetInput.trim() === '' ? null : parseFloat(budgetInput);
    if (budgetInput.trim() !== '' && (isNaN(val!) || val! < 0)) return;
    updateSettings({ monthly_budget: val });
  };

  const handleSignOut = async () => {
    haptic.light();
    await signOut();
  };

  const themeOptions = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-12 pb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
        </div>
      </header>

      <main className="px-5 space-y-6">
        {/* Currency Section */}
        <section className="expense-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">Currency</h2>
              <p className="text-sm text-muted-foreground">Choose your preferred currency</p>
            </div>
          </div>
          <Select value={settings.currency} onValueChange={handleCurrencyChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((code) => (
                <SelectItem key={code} value={code}>
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-muted-foreground">{getCurrencySymbol(code)}</span>
                    <span>{code}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        {/* Budget Section */}
        <section className="expense-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">Monthly Budget</h2>
              <p className="text-sm text-muted-foreground">Set a spending limit to track against</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">
                {currencySymbol}
              </span>
              <Input
                type="number"
                placeholder="No limit set"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                onBlur={handleBudgetSave}
                onKeyDown={(e) => e.key === 'Enter' && handleBudgetSave()}
                className="pl-8"
                min="0"
                step="100"
              />
            </div>
          </div>
          {settings.monthly_budget && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                setBudgetInput('');
                updateSettings({ monthly_budget: null });
              }}
            >
              Remove budget limit
            </Button>
          )}
        </section>

        {/* Theme Section */}
        <section className="expense-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <Palette className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">Appearance</h2>
              <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const isActive = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    haptic.light();
                    setTheme(opt.value);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 press-effect",
                    isActive
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Account Section */}
        <section className="expense-card space-y-4">
          <h2 className="font-display text-base font-semibold text-foreground">Account</h2>
          <div className="text-sm text-muted-foreground">{user?.email}</div>
          <Button
            variant="outline"
            className="w-full justify-between text-destructive border-destructive/20 hover:bg-destructive/5"
            onClick={handleSignOut}
          >
            <span className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Sign out
            </span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </section>
      </main>
    </div>
  );
};
