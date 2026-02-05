import { format } from 'date-fns';

interface MonthlySummaryProps {
  total: number;
  categoryTotals: Record<string, number>;
  month?: Date;
}

export const MonthlySummary = ({ total, categoryTotals, month = new Date() }: MonthlySummaryProps) => {
  const sortedCategories = Object.entries(categoryTotals)
    .filter(([_, total]) => total > 0)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  const maxTotal = Math.max(...sortedCategories.map(c => c.total), 1);

  return (
    <div className="summary-card text-primary-foreground">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium opacity-80">
          {format(month, 'MMMM yyyy')}
        </span>
        <span className="text-xs opacity-60">Total Spent</span>
      </div>
      
      <h2 className="font-display text-4xl font-bold mb-6">
        ₵{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </h2>

      {sortedCategories.length > 0 ? (
        <div className="space-y-3">
          {sortedCategories.map(category => (
            <div key={category.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-90">{category.name}</span>
                <span className="font-medium">
                  ₵{category.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="h-1.5 bg-primary-foreground/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-foreground/80 rounded-full transition-all duration-500"
                  style={{ width: `${(category.total / maxTotal) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm opacity-70 text-center py-4">
          No expenses yet this month
        </p>
      )}
    </div>
  );
};
