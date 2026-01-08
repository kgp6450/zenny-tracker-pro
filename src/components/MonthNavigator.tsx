import { format, addMonths, subMonths, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MonthNavigatorProps {
  selectedMonth: Date;
  onMonthChange: (month: Date) => void;
}

export const MonthNavigator = ({ selectedMonth, onMonthChange }: MonthNavigatorProps) => {
  const isCurrentMonth = isSameMonth(selectedMonth, new Date());

  const goToPreviousMonth = () => {
    onMonthChange(subMonths(selectedMonth, 1));
  };

  const goToNextMonth = () => {
    onMonthChange(addMonths(selectedMonth, 1));
  };

  const goToCurrentMonth = () => {
    onMonthChange(new Date());
  };

  return (
    <div className="flex items-center justify-between bg-card rounded-2xl p-2 shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        onClick={goToPreviousMonth}
        className="h-10 w-10 rounded-xl"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <button
        onClick={goToCurrentMonth}
        className="flex flex-col items-center px-4 py-1 rounded-xl hover:bg-muted transition-colors"
      >
        <span className="font-display font-semibold text-foreground">
          {format(selectedMonth, 'MMMM')}
        </span>
        <span className="text-xs text-muted-foreground">
          {format(selectedMonth, 'yyyy')}
        </span>
      </button>

      <Button
        variant="ghost"
        size="icon"
        onClick={goToNextMonth}
        disabled={isCurrentMonth}
        className="h-10 w-10 rounded-xl"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
};
