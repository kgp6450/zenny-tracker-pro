import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UserSettings {
  currency: string;
  monthly_budget: number | null;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  KRW: '₩',
  CNY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
  AED: 'د.إ',
  NGN: '₦',
  GHS: 'GH₵',
  KES: 'KSh',
  ZAR: 'R',
  BRL: 'R$',
  MXN: 'MX$',
};

export const CURRENCIES = Object.keys(CURRENCY_SYMBOLS);

export const getCurrencySymbol = (code: string) => CURRENCY_SYMBOLS[code] || code;

const DEFAULT_SETTINGS: UserSettings = {
  currency: 'INR',
  monthly_budget: null,
};

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('currency, monthly_budget')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching settings:', error);
      } else if (data) {
        setSettings({
          currency: data.currency,
          monthly_budget: data.monthly_budget,
        });
      }
      setIsLoaded(true);
    };

    fetchSettings();
  }, [user]);

  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    if (!user) return;

    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        currency: newSettings.currency,
        monthly_budget: newSettings.monthly_budget,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } else {
      toast.success('Settings saved');
    }
  }, [user, settings]);

  return {
    settings,
    isLoaded,
    updateSettings,
    currencySymbol: getCurrencySymbol(settings.currency),
  };
}
