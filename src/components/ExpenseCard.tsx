import { Expense, getCategoryInfo } from '@/types/expense';
import { format } from 'date-fns';

interface ExpenseCardProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
}

export const ExpenseCard = ({ expense, onEdit }: ExpenseCardProps) => {
  const categoryInfo = getCategoryInfo(expense.category);
  
  return (
    <button
      onClick={() => onEdit(expense)}
      className="expense-card flex items-center gap-4 w-full text-left"
    >
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

      <div className="flex items-center">
        <span className="font-display font-semibold text-lg">
          ₵{expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </button>
  );
};
