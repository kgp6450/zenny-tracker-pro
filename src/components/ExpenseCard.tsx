import { Expense, getCategoryInfo } from '@/types/expense';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExpenseCardProps {
  expense: Expense;
  onDelete: (id: string) => void;
}

export const ExpenseCard = ({ expense, onDelete }: ExpenseCardProps) => {
  const categoryInfo = getCategoryInfo(expense.category);
  
  return (
    <div className="expense-card flex items-center gap-4 group">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl category-${expense.category}`}>
        {categoryInfo.icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`category-badge category-${expense.category}`}>
            {categoryInfo.label}
          </span>
        </div>
        {expense.note && (
          <p className="text-sm text-muted-foreground truncate mt-1">
            {expense.note}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {format(new Date(expense.date), 'MMM d, yyyy')}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-display font-semibold text-lg">
          ₵{expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(expense.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
