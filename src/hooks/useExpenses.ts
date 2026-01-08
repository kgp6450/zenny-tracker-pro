import { useState, useEffect, useCallback } from 'react';
import { Expense, Category } from '@/types/expense';

const STORAGE_KEY = 'expense-tracker-data';

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setExpenses(parsed);
      } catch (e) {
        console.error('Failed to parse stored expenses:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever expenses change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    }
  }, [expenses, isLoaded]);

  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setExpenses(prev => [newExpense, ...prev]);
    return newExpense;
  }, []);

  const updateExpense = useCallback((id: string, updates: Partial<Omit<Expense, 'id' | 'createdAt'>>) => {
    setExpenses(prev => prev.map(expense => 
      expense.id === id ? { ...expense, ...updates } : expense
    ));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

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

  const getCategoryTotals = useCallback((month: Date = new Date()) => {
    const monthlyExpenses = getMonthlyExpenses(month);
    const totals: Record<Category, number> = {
      food: 0,
      transport: 0,
      entertainment: 0,
      bills: 0,
      other: 0,
    };

    monthlyExpenses.forEach(expense => {
      totals[expense.category] += expense.amount;
    });

    return totals;
  }, [getMonthlyExpenses]);

  const getRecentExpenses = useCallback((limit: number = 10) => {
    return [...expenses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
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
    getCategoryTotals,
    getRecentExpenses,
  };
};
