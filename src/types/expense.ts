export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  time: string;
  note?: string;
  createdAt: string;
}

// Legacy type for backwards compatibility
export type Category = 'food' | 'transport' | 'entertainment' | 'bills' | 'other' | string;

// Legacy constant - kept for backwards compatibility
export const CATEGORIES: { value: string; label: string; icon: string }[] = [
  { value: 'food', label: 'Food', icon: '🍔' },
  { value: 'transport', label: 'Transport', icon: '🚗' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { value: 'bills', label: 'Bills', icon: '📄' },
  { value: 'other', label: 'Other', icon: '📦' },
];

// Legacy function - kept for backwards compatibility
export const getCategoryInfo = (category: string) => {
  const found = CATEGORIES.find(c => c.value === category || c.label === category);
  return found || { value: category, label: category, icon: '📦' };
};
