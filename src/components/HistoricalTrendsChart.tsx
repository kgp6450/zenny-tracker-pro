import { useMemo, useState, forwardRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { format, endOfWeek, endOfMonth, endOfYear, eachWeekOfInterval, eachMonthOfInterval, eachYearOfInterval } from 'date-fns';
import { Expense } from '@/types/expense';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface HistoricalTrendsChartProps {
  expenses: Expense[];
}

type TrendPeriod = 'weeks' | 'months' | 'years';

interface TooltipData {
  fullLabel: string;
  total: number;
  count: number;
  average: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: TooltipData }>;
}

const CustomTooltip = forwardRef<HTMLDivElement, CustomTooltipProps>(
  ({ active, payload }, ref) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div ref={ref} className="bg-popover border border-border rounded-lg px-4 py-3 shadow-lg">
          <p className="font-medium text-foreground text-sm mb-2">{data.fullLabel}</p>
          <div className="space-y-1">
            <p className="text-sm text-primary">
              Total: ₵{data.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">
              {data.count} expense{data.count !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              Avg: ₵{data.average.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      );
    }
    return null;
  }
);

CustomTooltip.displayName = 'CustomTooltip';

export const HistoricalTrendsChart = ({ expenses }: HistoricalTrendsChartProps) => {
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('months');
  const minStartDate = new Date(2026, 0, 8); // January 8, 2026

  const trendData = useMemo(() => {
    const now = new Date();
    
    switch (trendPeriod) {
      case 'weeks': {
        // Show last 8 weeks
        const weeks = eachWeekOfInterval({
          start: minStartDate,
          end: now,
        }, { weekStartsOn: 1 }).slice(-8);

        return weeks.map(weekStart => {
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
          const weekExpenses = expenses.filter(e => {
            const date = new Date(e.date);
            return date >= weekStart && date <= weekEnd;
          });
          const total = weekExpenses.reduce((sum, e) => sum + e.amount, 0);
          const count = weekExpenses.length;
          
          return {
            label: format(weekStart, 'MMM d'),
            total,
            count,
            fullLabel: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`,
            average: count > 0 ? total / count : 0,
          };
        });
      }
      
      case 'months': {
        // Show last 12 months
        const months = eachMonthOfInterval({
          start: minStartDate,
          end: now,
        }).slice(-12);

        return months.map(monthStart => {
          const monthEnd = endOfMonth(monthStart);
          const monthExpenses = expenses.filter(e => {
            const date = new Date(e.date);
            return date >= monthStart && date <= monthEnd;
          });
          const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
          const count = monthExpenses.length;
          
          return {
            label: format(monthStart, 'MMM'),
            total,
            count,
            fullLabel: format(monthStart, 'MMMM yyyy'),
            average: count > 0 ? total / count : 0,
          };
        });
      }
      
      case 'years': {
        // Show last 5 years
        const years = eachYearOfInterval({
          start: minStartDate,
          end: now,
        }).slice(-5);

        return years.map(yearStart => {
          const yearEnd = endOfYear(yearStart);
          const yearExpenses = expenses.filter(e => {
            const date = new Date(e.date);
            return date >= yearStart && date <= yearEnd;
          });
          const total = yearExpenses.reduce((sum, e) => sum + e.amount, 0);
          const count = yearExpenses.length;
          
          return {
            label: format(yearStart, 'yyyy'),
            total,
            count,
            fullLabel: format(yearStart, 'yyyy'),
            average: count > 0 ? total / count : 0,
          };
        });
      }
    }
  }, [expenses, trendPeriod]);

  // Calculate trend percentage
  const trendPercentage = useMemo(() => {
    if (trendData.length < 2) return 0;
    const current = trendData[trendData.length - 1]?.total || 0;
    const previous = trendData[trendData.length - 2]?.total || 0;
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }, [trendData]);

  const hasData = trendData.some(d => d.total > 0);

  const TrendIcon = trendPercentage > 0 ? TrendingUp : trendPercentage < 0 ? TrendingDown : Minus;
  const trendColor = trendPercentage > 0 ? 'text-destructive' : trendPercentage < 0 ? 'text-green-500' : 'text-muted-foreground';

  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-foreground">Historical Trends</h3>
          <div className={`flex items-center gap-1 text-xs mt-1 ${trendColor}`}>
            <TrendIcon className="h-3 w-3" />
            <span>
              {trendPercentage > 0 ? '+' : ''}{trendPercentage.toFixed(1)}% vs previous
            </span>
          </div>
        </div>
        <div className="flex bg-muted rounded-lg p-1">
          {(['weeks', 'months', 'years'] as TrendPeriod[]).map(period => (
            <button
              key={period}
              onClick={() => setTrendPeriod(period)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                trendPeriod === period
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {!hasData ? (
        <div className="flex items-center justify-center h-56 text-muted-foreground text-sm">
          No spending data to display
        </div>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.5)' }} />
              <Bar
                dataKey="total"
                fill="hsl(var(--primary))"
                radius={[6, 6, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary stats */}
      {hasData && (
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-sm font-semibold tabular-nums">
              ₵{trendData.reduce((sum, d) => sum + d.total, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Average</p>
            <p className="text-sm font-semibold tabular-nums">
              ₵{(trendData.reduce((sum, d) => sum + d.total, 0) / trendData.filter(d => d.total > 0).length || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Highest</p>
            <p className="text-sm font-semibold tabular-nums">
              ₵{Math.max(...trendData.map(d => d.total)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
