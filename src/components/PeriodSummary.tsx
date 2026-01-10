import { Category, CATEGORIES } from '@/types/expense';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { PeriodType } from './PeriodNavigator';

interface PeriodSummaryProps {
  total: number;
  categoryTotals: Record<Category, number>;
  date: Date;
  periodType: PeriodType;
}

export const PeriodSummary = ({ total, categoryTotals, date, periodType }: PeriodSummaryProps) => {
  const sortedCategories = CATEGORIES
    .map(cat => ({ ...cat, total: categoryTotals[cat.value] }))
    .filter(cat => cat.total > 0)
    .sort((a, b) => b.total - a.total);

  const maxTotal = Math.max(...sortedCategories.map(c => c.total), 1);

  const getPeriodLabel = () => {
    switch (periodType) {
      case 'week': {
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'd, yyyy')}`;
      }
      case 'month':
        return format(date, 'MMMM yyyy');
      case 'year':
        return format(date, 'yyyy');
    }
  };

  const getEmptyMessage = () => {
    switch (periodType) {
      case 'week':
        return 'No expenses yet this week';
      case 'month':
        return 'No expenses yet this month';
      case 'year':
        return 'No expenses yet this year';
    }
  };

  return (
    <div className="summary-card text-primary-foreground">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium opacity-80">
          {getPeriodLabel()}
        </span>
        <span className="text-xs opacity-60">Total Spent</span>
      </div>
      
      <h2 className="font-display text-4xl font-bold mb-6">
        ₵{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </h2>

      {sortedCategories.length > 0 ? (
        <div className="space-y-3">
          {sortedCategories.map(category => (
            <div key={category.value} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span>{category.icon}</span>
                  <span className="opacity-90">{category.label}</span>
                </span>
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
          {getEmptyMessage()}
        </p>
      )}
    </div>
  );
};
