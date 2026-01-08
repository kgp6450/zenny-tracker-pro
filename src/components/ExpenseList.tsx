import { Expense } from '@/types/expense';
import { ExpenseCard } from './ExpenseCard';
import { Receipt } from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
}

export const ExpenseList = ({ expenses, onDelete }: ExpenseListProps) => {
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Receipt className="w-8 h-8" />
        </div>
        <p className="font-medium">No expenses yet</p>
        <p className="text-sm">Tap the + button to add your first expense</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map(expense => (
        <ExpenseCard 
          key={expense.id} 
          expense={expense} 
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
