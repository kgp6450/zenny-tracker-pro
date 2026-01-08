export type Category = 'food' | 'transport' | 'entertainment' | 'bills' | 'other';

export interface Expense {
  id: string;
  amount: number;
  category: Category;
  date: string;
  note?: string;
  createdAt: string;
}

export const CATEGORIES: { value: Category; label: string; icon: string }[] = [
  { value: 'food', label: 'Food', icon: '🍔' },
  { value: 'transport', label: 'Transport', icon: '🚗' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { value: 'bills', label: 'Bills', icon: '📄' },
  { value: 'other', label: 'Other', icon: '📦' },
];

export const getCategoryInfo = (category: Category) => {
  return CATEGORIES.find(c => c.value === category) || CATEGORIES[4];
};
