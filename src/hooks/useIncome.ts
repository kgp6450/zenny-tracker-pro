import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Income {
  id: string;
  amount: number;
  source: string;
  date: string;
  note?: string;
  created_at: string;
}

export const useIncome = () => {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchIncome = useCallback(async () => {
    if (!user) {
      setIncomes([]);
      setIsLoaded(true);
      return;
    }

    const { data, error } = await supabase
      .from('income')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching income:', error);
    } else {
      setIncomes(
        (data || []).map(i => ({
          id: i.id,
          amount: Number(i.amount),
          source: i.source,
          date: i.date,
          note: i.note || undefined,
          created_at: i.created_at,
        }))
      );
    }
    setIsLoaded(true);
  }, [user]);

  useEffect(() => {
    fetchIncome();
  }, [fetchIncome]);

  const addIncome = useCallback(async (income: { amount: number; source: string; date: string; note?: string }) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('income')
      .insert({
        user_id: user.id,
        amount: income.amount,
        source: income.source,
        date: income.date,
        note: income.note || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding income:', error);
      throw error;
    }

    if (data) {
      setIncomes(prev => [{
        id: data.id,
        amount: Number(data.amount),
        source: data.source,
        date: data.date,
        note: data.note || undefined,
        created_at: data.created_at,
      }, ...prev]);
    }
  }, [user]);

  const updateIncome = useCallback(async (id: string, updates: { amount: number; source: string; date: string; note?: string }) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('income')
      .update({
        amount: updates.amount,
        source: updates.source,
        date: updates.date,
        note: updates.note || null,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating income:', error);
      throw error;
    }

    if (data) {
      setIncomes(prev => prev.map(i => i.id === id ? {
        id: data.id,
        amount: Number(data.amount),
        source: data.source,
        date: data.date,
        note: data.note || undefined,
        created_at: data.created_at,
      } : i));
    }
  }, [user]);

  const deleteIncome = useCallback(async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('income')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting income:', error);
      throw error;
    }

    setIncomes(prev => prev.filter(i => i.id !== id));
  }, [user]);

  const getMonthlyIncome = useCallback((date: Date) => {
    const month = date.getMonth();
    const year = date.getFullYear();
    return incomes
      .filter(i => {
        const d = new Date(i.date);
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .reduce((sum, i) => sum + i.amount, 0);
  }, [incomes]);

  return {
    incomes,
    addIncome,
    updateIncome,
    deleteIncome,
    getMonthlyIncome,
    isLoaded,
    refreshIncome: fetchIncome,
  };
};
