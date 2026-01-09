import { useMemo, useState } from 'react';
import { Expense } from '@/types/expense';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExpenseCalendarProps {
  expenses: Expense[];
  selectedMonth: Date;
  onDaySelect: (date: Date, expenses: Expense[]) => void;
}

export const ExpenseCalendar = ({ expenses, selectedMonth, onDaySelect }: ExpenseCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const dailyTotals = useMemo(() => {
    const totals: Record<string, { total: number; expenses: Expense[] }> = {};
    
    expenses.forEach(expense => {
      const dateKey = expense.date;
      if (!totals[dateKey]) {
        totals[dateKey] = { total: 0, expenses: [] };
      }
      totals[dateKey].total += expense.amount;
      totals[dateKey].expenses.push(expense);
    });

    return totals;
  }, [expenses]);

  const calendarDays = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    const days = eachDayOfInterval({ start, end });
    
    // Get the day of week for the first day (0 = Sunday)
    const startDay = start.getDay();
    
    // Add empty slots for days before the first of the month
    const emptySlots = Array(startDay).fill(null);
    
    return [...emptySlots, ...days];
  }, [selectedMonth]);

  const handleDayClick = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayData = dailyTotals[dateKey];
    setSelectedDate(day);
    onDaySelect(day, dayData?.expenses || []);
  };

  const maxTotal = useMemo(() => {
    return Math.max(...Object.values(dailyTotals).map(d => d.total), 1);
  }, [dailyTotals]);

  const getIntensity = (total: number): string => {
    if (total === 0) return '';
    const ratio = total / maxTotal;
    if (ratio < 0.25) return 'bg-primary/20';
    if (ratio < 0.5) return 'bg-primary/40';
    if (ratio < 0.75) return 'bg-primary/60';
    return 'bg-primary/80';
  };

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateKey = format(day, 'yyyy-MM-dd');
          const dayData = dailyTotals[dateKey];
          const hasExpenses = dayData && dayData.total > 0;
          const isSelected = selectedDate && isSameDay(day, selectedDate);

          return (
            <button
              key={dateKey}
              onClick={() => handleDayClick(day)}
              className={cn(
                "aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all relative",
                isToday(day) && "ring-2 ring-primary ring-offset-1",
                isSelected && "bg-primary text-primary-foreground",
                !isSelected && hasExpenses && getIntensity(dayData.total),
                !isSelected && !hasExpenses && "hover:bg-muted",
              )}
            >
              <span className={cn(
                "font-medium",
                isSelected ? "text-primary-foreground" : "text-foreground"
              )}>
                {format(day, 'd')}
              </span>
              {hasExpenses && !isSelected && (
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  ₵{dayData.total >= 1000 ? `${(dayData.total / 1000).toFixed(1)}k` : dayData.total.toFixed(0)}
                </span>
              )}
              {hasExpenses && isSelected && (
                <span className="text-[10px] text-primary-foreground/80 mt-0.5">
                  ₵{dayData.total >= 1000 ? `${(dayData.total / 1000).toFixed(1)}k` : dayData.total.toFixed(0)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded bg-muted" />
            <div className="w-3 h-3 rounded bg-primary/20" />
            <div className="w-3 h-3 rounded bg-primary/40" />
            <div className="w-3 h-3 rounded bg-primary/60" />
            <div className="w-3 h-3 rounded bg-primary/80" />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
};
