import { Expense } from '@/types/expense';
import { ExpenseCard } from './ExpenseCard';
import { Receipt } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { useMemo } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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

const getDayTotal = (expenses: Expense[]): number => {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
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

  // Start with all sections collapsed
  const defaultOpenDays: string[] = [];

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
    <Accordion type="multiple" defaultValue={defaultOpenDays} className="space-y-2">
      {groupedExpenses.map(([date, dateExpenses]) => (
        <AccordionItem 
          key={date} 
          value={date}
          className="border rounded-xl bg-card/50 px-3 overflow-hidden"
        >
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex items-center justify-between w-full pr-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{formatDateHeader(date)}</span>
                <span className="text-xs text-muted-foreground">
                  ({dateExpenses.length} {dateExpenses.length === 1 ? 'item' : 'items'})
                </span>
              </div>
              <span className="text-sm font-semibold text-primary">
                ₵{getDayTotal(dateExpenses).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-2">
            <div className="space-y-1">
              {dateExpenses.map(expense => (
                <ExpenseCard 
                  key={expense.id} 
                  expense={expense} 
                  onEdit={onEdit}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
