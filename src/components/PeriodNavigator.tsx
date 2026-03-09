import { format, addMonths, subMonths, addWeeks, subWeeks, addYears, subYears, isSameMonth, isSameWeek, isSameYear, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type PeriodType = 'week' | 'month' | 'year';

interface PeriodNavigatorProps {
  selectedDate: Date;
  periodType: PeriodType;
  onDateChange: (date: Date) => void;
  onPeriodTypeChange: (type: PeriodType) => void;
}

export const PeriodNavigator = ({ 
  selectedDate, 
  periodType, 
  onDateChange, 
  onPeriodTypeChange 
}: PeriodNavigatorProps) => {
  const now = new Date();
  
  const isCurrentPeriod = () => {
    switch (periodType) {
      case 'week':
        return isSameWeek(selectedDate, now, { weekStartsOn: 1 });
      case 'month':
        return isSameMonth(selectedDate, now);
      case 'year':
        return isSameYear(selectedDate, now);
    }
  };

  const goToPrevious = () => {
    switch (periodType) {
      case 'week':
        onDateChange(subWeeks(selectedDate, 1));
        break;
      case 'month':
        onDateChange(subMonths(selectedDate, 1));
        break;
      case 'year':
        onDateChange(subYears(selectedDate, 1));
        break;
    }
  };

  const goToNext = () => {
    switch (periodType) {
      case 'week':
        onDateChange(addWeeks(selectedDate, 1));
        break;
      case 'month':
        onDateChange(addMonths(selectedDate, 1));
        break;
      case 'year':
        onDateChange(addYears(selectedDate, 1));
        break;
    }
  };

  const goToCurrent = () => {
    onDateChange(new Date());
  };

  const getDisplayText = () => {
    switch (periodType) {
      case 'week': {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      }
      case 'month':
        return format(selectedDate, 'MMMM yyyy');
      case 'year':
        return format(selectedDate, 'yyyy');
    }
  };

  return (
    <div className="space-y-3">
      {/* Period Type Tabs */}
      <div className="flex bg-muted rounded-xl p-1.5">
        {(['week', 'month', 'year'] as PeriodType[]).map((type) => (
          <button
            key={type}
            onClick={() => onPeriodTypeChange(type)}
            className={cn(
              "flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors capitalize",
              periodType === type 
                ? "bg-background shadow-sm text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-card rounded-2xl p-2 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevious}
          className="h-10 w-10 rounded-xl"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <button
          onClick={goToCurrent}
          className="flex flex-col items-center px-4 py-1 rounded-xl hover:bg-muted transition-colors"
        >
          <span className="font-display font-semibold text-foreground text-center">
            {getDisplayText()}
          </span>
          {!isCurrentPeriod() && (
            <span className="text-xs text-muted-foreground">
              Tap to go to current {periodType}
            </span>
          )}
        </button>

        <Button
          variant="ghost"
          size="icon"
          onClick={goToNext}
          disabled={isCurrentPeriod()}
          className="h-10 w-10 rounded-xl"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
