import { Expense } from '@/types/expense';
import { ExpenseCard } from './ExpenseCard';
import { Receipt } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { useMemo } from 'react';

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
}

const formatDateHeader = (dateString: string): string => {
  const date = new Date(dateString);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEEE, MMM d');
};

export const ExpenseList = ({ expenses, onEdit }: ExpenseListProps) => {
  const groupedExpenses = useMemo(() => {
    const groups: Record<string, Expense[]> = {};
    
    expenses.forEach(expense => {
      const dateKey = expense.date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(expense);
    });

    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [expenses]);

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
    <div className="space-y-4">
      {groupedExpenses.map(([date, dateExpenses]) => (
        <div key={date} className="space-y-1">
          <h3 className="text-xs font-medium text-muted-foreground px-1 mb-2">
            {formatDateHeader(date)}
          </h3>
          <div className="space-y-1">
            {dateExpenses.map(expense => (
              <ExpenseCard 
                key={expense.id} 
                expense={expense} 
                onEdit={onEdit}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
