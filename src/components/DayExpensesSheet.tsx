import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Expense, getCategoryInfo } from '@/types/expense';
import { format } from 'date-fns';

interface DayExpensesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  expenses: Expense[];
  onEditExpense: (expense: Expense) => void;
}

export const DayExpensesSheet = ({ 
  open, 
  onOpenChange, 
  date, 
  expenses,
  onEditExpense 
}: DayExpensesSheetProps) => {
  if (!date) return null;

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl h-auto max-h-[70vh]">
        <SheetHeader className="pb-4">
          <SheetTitle className="font-display text-xl">
            {format(date, 'EEEE, MMMM d')}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'} · Total: ₵{total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </SheetHeader>

        <div className="space-y-3 overflow-y-auto max-h-[50vh]">
          {expenses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No expenses on this day
            </p>
          ) : (
            expenses
              .sort((a, b) => b.time.localeCompare(a.time))
              .map(expense => {
                const categoryInfo = getCategoryInfo(expense.category);
                return (
                  <button
                    key={expense.id}
                    onClick={() => {
                      onEditExpense(expense);
                      onOpenChange(false);
                    }}
                    className="expense-card flex items-center gap-4 w-full text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg category-${expense.category}`}>
                      {categoryInfo.icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`category-badge category-${expense.category} text-xs`}>
                          {categoryInfo.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {expense.time?.slice(0, 5)}
                        </span>
                      </div>
                      {expense.note && (
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {expense.note}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center">
                      <span className="font-display font-semibold">
                        ₵{expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </button>
                );
              })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
