import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { format, subWeeks, subMonths, subYears, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfDay, endOfDay, eachWeekOfInterval, eachMonthOfInterval, eachYearOfInterval, eachDayOfInterval } from 'date-fns';
import { Expense } from '@/types/expense';
import { PeriodType } from './PeriodNavigator';

interface SpendingTrendsChartProps {
  expenses: Expense[];
  periodType: PeriodType;
  currentDate: Date;
}

export const SpendingTrendsChart = ({ expenses, periodType, currentDate }: SpendingTrendsChartProps) => {
  const trendData = useMemo(() => {
    const now = currentDate;
    
    switch (periodType) {
      case 'week': {
        // Show daily expenses for the selected week
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        
        const days = eachDayOfInterval({
          start: weekStart,
          end: weekEnd,
        });

        return days.map(day => {
          const dayStart = startOfDay(day);
          const dayEnd = endOfDay(day);
          const dayExpenses = expenses.filter(e => {
            const date = new Date(e.date);
            return date >= dayStart && date <= dayEnd;
          });
          const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
          
          return {
            label: format(day, 'EEE'),
            total,
            fullLabel: format(day, 'EEEE, MMM d'),
          };
        });
      }
      
      case 'month': {
        // Show daily expenses starting from January 8, 2026
        const startDate = new Date(2026, 0, 8); // January 8, 2026
        const endDate = now > startDate ? now : startDate;
        
        const days = eachDayOfInterval({
          start: startDate,
          end: endDate,
        });

        return days.map(day => {
          const dayStart = startOfDay(day);
          const dayEnd = endOfDay(day);
          const dayExpenses = expenses.filter(e => {
            const date = new Date(e.date);
            return date >= dayStart && date <= dayEnd;
          });
          const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
          
          return {
            label: format(day, 'd'),
            total,
            fullLabel: format(day, 'EEEE, MMM d'),
          };
        });
      }
      
      case 'year': {
        // Show last 12 months
        const months = eachMonthOfInterval({
          start: subMonths(now, 11),
          end: now,
        });

        return months.map(monthStart => {
          const monthEnd = endOfMonth(monthStart);
          const monthExpenses = expenses.filter(e => {
            const date = new Date(e.date);
            return date >= monthStart && date <= monthEnd;
          });
          const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
          
          return {
            label: format(monthStart, 'MMM'),
            total,
            fullLabel: format(monthStart, 'MMMM yyyy'),
          };
        });
      }
    }
  }, [expenses, periodType, currentDate]);

  const maxValue = Math.max(...trendData.map(d => d.total), 1);
  const hasData = trendData.some(d => d.total > 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="font-medium text-foreground text-sm">{data.fullLabel}</p>
          <p className="text-sm text-primary">
            ₵{data.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  const getPeriodLabel = () => {
    switch (periodType) {
      case 'week':
        return 'This Week (Daily)';
      case 'month':
        return 'Last 30 Days';
      case 'year':
        return 'Last 12 Months';
    }
  };

  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-foreground">Spending Trends</h3>
        <span className="text-xs text-muted-foreground">{getPeriodLabel()}</span>
      </div>
      
      {!hasData ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          No spending data to display
        </div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                vertical={false}
              />
              <XAxis 
                dataKey="label" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickFormatter={(value) => `₵${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorTotal)"
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }}
                activeDot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: 'hsl(var(--background))', r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
