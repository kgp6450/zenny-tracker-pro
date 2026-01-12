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
      className="expense-card flex items-center gap-3 w-full text-left py-2"
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm category-${expense.category}`}>
        {categoryInfo.icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{categoryInfo.label}</span>
          {expense.note && (
            <span className="text-xs text-muted-foreground truncate">· {expense.note}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {expense.time?.slice(0, 5) || '12:00'}
        </span>
        <span className="font-display font-semibold text-sm">
          ₵{expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </button>
  );
};
