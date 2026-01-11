import { useState, useEffect, useCallback, useRef } from 'react';
import { Expense, Category } from '@/types/expense';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSyncQueue } from '@/hooks/useSyncQueue';

export const useExpenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchExpenses = useCallback(async () => {
    if (!user) {
      setExpenses([]);
      setIsLoaded(true);
      return;
    }

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
    } else {
      setExpenses(
        (data || []).map(e => ({
          id: e.id,
          amount: Number(e.amount),
          category: e.category as Category,
          date: e.date,
          time: e.time || '12:00:00',
          note: e.note || undefined,
          createdAt: e.created_at,
        }))
      );
    }
    setIsLoaded(true);
  }, [user]);

  const { addToQueue, pendingCount, isSyncing } = useSyncQueue(user?.id, fetchExpenses);

  // Fetch expenses from Supabase
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = useCallback(async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    if (!user) return null;

    // If offline, queue the action and add optimistically
    if (!isOnline) {
      const tempId = crypto.randomUUID();
      const newExpense: Expense = {
        id: tempId,
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
        time: expense.time,
        note: expense.note,
        createdAt: new Date().toISOString(),
      };
      
      addToQueue({
        type: 'add',
        payload: {
          amount: expense.amount,
          category: expense.category,
          date: expense.date,
          time: expense.time,
          note: expense.note || null,
        },
      });
      
      setExpenses(prev => [newExpense, ...prev]);
      return newExpense;
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: user.id,
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
        time: expense.time,
        note: expense.note || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding expense:', error);
      return null;
    }

    const newExpense: Expense = {
      id: data.id,
      amount: Number(data.amount),
      category: data.category as Category,
      date: data.date,
      time: data.time || '12:00:00',
      note: data.note || undefined,
      createdAt: data.created_at,
    };

    setExpenses(prev => [newExpense, ...prev]);
    return newExpense;
  }, [user, isOnline, addToQueue]);

  const updateExpense = useCallback(async (id: string, updates: Partial<Omit<Expense, 'id' | 'createdAt'>>) => {
    // If offline, queue the action and update optimistically
    if (!isOnline) {
      const currentExpense = expenses.find(e => e.id === id);
      if (currentExpense) {
        addToQueue({
          type: 'update',
          payload: {
            id,
            amount: updates.amount ?? currentExpense.amount,
            category: updates.category ?? currentExpense.category,
            date: updates.date ?? currentExpense.date,
            time: updates.time ?? currentExpense.time,
            note: updates.note ?? currentExpense.note ?? null,
          },
        });
      }
      
      setExpenses(prev => prev.map(expense =>
        expense.id === id ? { ...expense, ...updates } : expense
      ));
      return;
    }

    const { error } = await supabase
      .from('expenses')
      .update({
        amount: updates.amount,
        category: updates.category,
        date: updates.date,
        time: updates.time,
        note: updates.note || null,
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating expense:', error);
      return;
    }

    setExpenses(prev => prev.map(expense =>
      expense.id === id ? { ...expense, ...updates } : expense
    ));
  }, [isOnline, addToQueue, expenses]);

  const deleteExpense = useCallback(async (id: string) => {
    // If offline, queue the action and delete optimistically
    if (!isOnline) {
      addToQueue({
        type: 'delete',
        payload: { id },
      });
      
      setExpenses(prev => prev.filter(e => e.id !== id));
      return;
    }

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting expense:', error);
      return;
    }

    setExpenses(prev => prev.filter(e => e.id !== id));
  }, [isOnline, addToQueue]);

  const getMonthlyExpenses = useCallback((month: Date = new Date()) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();

    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getFullYear() === year && expenseDate.getMonth() === monthIndex;
    });
  }, [expenses]);

  const getMonthlyTotal = useCallback((month: Date = new Date()) => {
    const monthlyExpenses = getMonthlyExpenses(month);
    return monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [getMonthlyExpenses]);

  const getCategoryTotals = useCallback((expenseList: Expense[]) => {
    const totals: Record<Category, number> = {
      food: 0,
      transport: 0,
      entertainment: 0,
      bills: 0,
      other: 0,
    };

    expenseList.forEach(expense => {
      totals[expense.category] += expense.amount;
    });

    return totals;
  }, []);

  const getWeeklyExpenses = useCallback((date: Date = new Date()) => {
    const { startOfWeek, endOfWeek } = require('date-fns');
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= weekStart && expenseDate <= weekEnd;
    });
  }, [expenses]);

  const getYearlyExpenses = useCallback((date: Date = new Date()) => {
    const year = date.getFullYear();

    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getFullYear() === year;
    });
  }, [expenses]);

  const getWeeklyTotal = useCallback((date: Date = new Date()) => {
    const weeklyExpenses = getWeeklyExpenses(date);
    return weeklyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [getWeeklyExpenses]);

  const getYearlyTotal = useCallback((date: Date = new Date()) => {
    const yearlyExpenses = getYearlyExpenses(date);
    return yearlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [getYearlyExpenses]);

  const getRecentExpenses = useCallback((limit: number = 10) => {
    return [...expenses]
      .sort((a, b) => {
        const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return b.time.localeCompare(a.time);
      })
      .slice(0, limit);
  }, [expenses]);

  return {
    expenses,
    isLoaded,
    addExpense,
    updateExpense,
    deleteExpense,
    getMonthlyExpenses,
    getMonthlyTotal,
    getWeeklyExpenses,
    getWeeklyTotal,
    getYearlyExpenses,
    getYearlyTotal,
    getCategoryTotals,
    getRecentExpenses,
    pendingCount,
    isSyncing,
  };
};
