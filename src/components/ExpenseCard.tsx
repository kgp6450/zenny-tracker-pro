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
      className="expense-card flex items-center gap-3 w-full text-left py-2 press-effect tap-feedback transform-gpu transition-[transform,box-shadow] duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.01] active:scale-[0.98] active:transition-none"
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm category-${expense.category} transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110`}>
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
        <span className="text-xs text-muted-foreground tabular-nums">
          {expense.time?.slice(0, 5) || '12:00'}
        </span>
        <span className="font-display font-semibold text-sm tabular-nums">
          ₵{expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </button>
  );
};
