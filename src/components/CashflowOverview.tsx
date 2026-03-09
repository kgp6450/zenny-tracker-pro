import { useMemo } from 'react';
import { TrendingDown, TrendingUp, Wallet, ArrowDownRight, Calendar, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Expense } from '@/types/expense';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  startOfYear, 
  endOfYear, 
  differenceInDays, 
  isWithinInterval, 
  subMonths,
  format,
  eachDayOfInterval,
  isSameDay
} from 'date-fns';
import { PeriodType } from './PeriodNavigator';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface CashflowOverviewProps {
  expenses: Expense[];
  periodType: PeriodType;
  currentDate: Date;
}

export const CashflowOverview = ({ expenses, periodType, currentDate }: CashflowOverviewProps) => {
  const stats = useMemo(() => {
    // Get period boundaries
    let periodStart: Date;
    let periodEnd: Date;
    let prevPeriodStart: Date;
    let prevPeriodEnd: Date;

    switch (periodType) {
      case 'week':
        periodStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        periodEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        prevPeriodStart = startOfWeek(subMonths(currentDate, 0), { weekStartsOn: 1 });
        prevPeriodEnd = endOfWeek(subMonths(currentDate, 0), { weekStartsOn: 1 });
        prevPeriodStart = new Date(periodStart.getTime() - 7 * 24 * 60 * 60 * 1000);
        prevPeriodEnd = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        periodStart = startOfYear(currentDate);
        periodEnd = endOfYear(currentDate);
        prevPeriodStart = startOfYear(subMonths(currentDate, 12));
        prevPeriodEnd = endOfYear(subMonths(currentDate, 12));
        break;
      default:
        periodStart = startOfMonth(currentDate);
        periodEnd = endOfMonth(currentDate);
        prevPeriodStart = startOfMonth(subMonths(currentDate, 1));
        prevPeriodEnd = endOfMonth(subMonths(currentDate, 1));
    }

    // Current period expenses
    const periodExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      return isWithinInterval(expenseDate, { start: periodStart, end: periodEnd });
    });

    // Previous period expenses
    const prevPeriodExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      return isWithinInterval(expenseDate, { start: prevPeriodStart, end: prevPeriodEnd });
    });

    // Calculate totals
    const totalSpent = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const prevTotalSpent = prevPeriodExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Calculate days in period
    const daysInPeriod = differenceInDays(periodEnd, periodStart) + 1;
    const today = new Date();
    const daysElapsed = Math.min(
      differenceInDays(today, periodStart) + 1,
      daysInPeriod
    );
    const daysRemaining = Math.max(0, daysInPeriod - daysElapsed);

    // Daily average
    const dailyAverage = daysElapsed > 0 ? totalSpent / daysElapsed : 0;
    const prevDailyAverage = daysInPeriod > 0 ? prevTotalSpent / daysInPeriod : 0;

    // Projected spending (if current rate continues)
    const projectedTotal = dailyAverage * daysInPeriod;

    // Transaction count
    const transactionCount = periodExpenses.length;
    const prevTransactionCount = prevPeriodExpenses.length;

    // Average per transaction
    const avgPerTransaction = transactionCount > 0 ? totalSpent / transactionCount : 0;

    // Spending velocity (transactions per day)
    const velocity = daysElapsed > 0 ? transactionCount / daysElapsed : 0;

    // Calculate change percentages
    const totalChange = prevTotalSpent > 0 
      ? ((totalSpent - prevTotalSpent) / prevTotalSpent) * 100 
      : 0;
    const dailyChange = prevDailyAverage > 0 
      ? ((dailyAverage - prevDailyAverage) / prevDailyAverage) * 100 
      : 0;

    // Generate chart data - cumulative spending over the period
    const days = eachDayOfInterval({ start: periodStart, end: periodEnd });
    const chartData = days.map(day => {
      const dayExpenses = periodExpenses.filter(e => isSameDay(new Date(e.date), day));
      const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
      return {
        date: format(day, 'MMM d'),
        shortDate: format(day, 'd'),
        amount: dayTotal,
      };
    });

    // Calculate cumulative
    let cumulative = 0;
    const cumulativeData = chartData.map(d => {
      cumulative += d.amount;
      return { ...d, cumulative };
    });

    return {
      totalSpent,
      dailyAverage,
      projectedTotal,
      transactionCount,
      avgPerTransaction,
      velocity,
      daysRemaining,
      daysElapsed,
      totalChange,
      dailyChange,
      chartData: cumulativeData,
    };
  }, [expenses, periodType, currentDate]);

  const formatCurrency = (value: number) => 
    `GHS ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatChange = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <Card className="border border-border/50 shadow-sm bg-card rounded-3xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Cashflow Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cumulative Spending Chart */}
        <div className="h-32 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.chartData}>
              <defs>
                <linearGradient id="cashflowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="shortDate" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                interval="preserveStartEnd"
              />
              <YAxis hide />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border rounded-lg px-3 py-2 shadow-lg">
                        <p className="text-xs text-muted-foreground">{data.date}</p>
                        <p className="text-sm font-medium">
                          Daily: {formatCurrency(data.amount)}
                        </p>
                        <p className="text-xs text-primary">
                          Cumulative: {formatCurrency(data.cumulative)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#cashflowGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Daily Average */}
          <div className="bg-muted/50 rounded-xl p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-xs">Daily Avg</span>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {formatCurrency(stats.dailyAverage)}
            </p>
            {stats.dailyChange !== 0 && (
              <p className={`text-xs flex items-center gap-1 ${stats.dailyChange > 0 ? 'text-destructive' : 'text-primary'}`}>
                {stats.dailyChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {formatChange(stats.dailyChange)} vs last
              </p>
            )}
          </div>

          {/* Projected Total */}
          <div className="bg-muted/50 rounded-xl p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ArrowDownRight className="h-3.5 w-3.5" />
              <span className="text-xs">Projected</span>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {formatCurrency(stats.projectedTotal)}
            </p>
            <p className="text-xs text-muted-foreground">
              {stats.daysRemaining} days left
            </p>
          </div>

          {/* Transaction Count */}
          <div className="bg-muted/50 rounded-xl p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Wallet className="h-3.5 w-3.5" />
              <span className="text-xs">Transactions</span>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {stats.transactionCount}
            </p>
            <p className="text-xs text-muted-foreground">
              ~{stats.velocity.toFixed(1)}/day
            </p>
          </div>

          {/* Average per Transaction */}
          <div className="bg-muted/50 rounded-xl p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Activity className="h-3.5 w-3.5" />
              <span className="text-xs">Avg/Transaction</span>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {formatCurrency(stats.avgPerTransaction)}
            </p>
            {stats.totalChange !== 0 && (
              <p className={`text-xs flex items-center gap-1 ${stats.totalChange > 0 ? 'text-destructive' : 'text-primary'}`}>
                {stats.totalChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {formatChange(stats.totalChange)} total
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
