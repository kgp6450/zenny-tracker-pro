import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from 'recharts';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, eachDayOfInterval, eachMonthOfInterval, eachWeekOfInterval, isWithinInterval } from 'date-fns';
import { Expense } from '@/types/expense';
import { Income } from '@/hooks/useIncome';
import { PeriodType } from './PeriodNavigator';
import { TrendingUp, TrendingDown, Scale } from 'lucide-react';

interface SpendingVsIncomeChartProps {
  expenses: Expense[];
  incomes: Income[];
  periodType: PeriodType;
  currentDate: Date;
}

export const SpendingVsIncomeChart = ({ expenses, incomes, periodType, currentDate }: SpendingVsIncomeChartProps) => {
  const { chartData, totalIncome, totalExpenses, netFlow } = useMemo(() => {
    let periodStart: Date;
    let periodEnd: Date;

    switch (periodType) {
      case 'week':
        periodStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        periodEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        break;
      case 'year':
        periodStart = startOfYear(currentDate);
        periodEnd = endOfYear(currentDate);
        break;
      default:
        periodStart = startOfMonth(currentDate);
        periodEnd = endOfMonth(currentDate);
    }

    const interval = { start: periodStart, end: periodEnd };

    const periodExpenses = expenses.filter(e => isWithinInterval(new Date(e.date), interval));
    const periodIncomes = incomes.filter(i => isWithinInterval(new Date(i.date), interval));

    const totalIncome = periodIncomes.reduce((s, i) => s + i.amount, 0);
    const totalExpenses = periodExpenses.reduce((s, e) => s + e.amount, 0);

    let data: { label: string; fullLabel: string; income: number; expenses: number }[];

    if (periodType === 'week') {
      const days = eachDayOfInterval(interval);
      data = days.map(day => {
        const dayIncome = periodIncomes.filter(i => new Date(i.date).toDateString() === day.toDateString()).reduce((s, i) => s + i.amount, 0);
        const dayExpense = periodExpenses.filter(e => new Date(e.date).toDateString() === day.toDateString()).reduce((s, e) => s + e.amount, 0);
        return { label: format(day, 'EEE'), fullLabel: format(day, 'EEEE, MMM d'), income: dayIncome, expenses: dayExpense };
      });
    } else if (periodType === 'year') {
      const months = eachMonthOfInterval(interval);
      data = months.map(m => {
        const mEnd = endOfMonth(m);
        const mIncome = periodIncomes.filter(i => isWithinInterval(new Date(i.date), { start: m, end: mEnd })).reduce((s, i) => s + i.amount, 0);
        const mExpense = periodExpenses.filter(e => isWithinInterval(new Date(e.date), { start: m, end: mEnd })).reduce((s, e) => s + e.amount, 0);
        return { label: format(m, 'MMM'), fullLabel: format(m, 'MMMM yyyy'), income: mIncome, expenses: mExpense };
      });
    } else {
      // month - show weekly buckets
      const weeks = eachWeekOfInterval(interval, { weekStartsOn: 1 });
      data = weeks.map((wStart, idx) => {
        const wEnd = endOfWeek(wStart, { weekStartsOn: 1 });
        const clampedEnd = wEnd > periodEnd ? periodEnd : wEnd;
        const clampedStart = wStart < periodStart ? periodStart : wStart;
        const wIncome = periodIncomes.filter(i => isWithinInterval(new Date(i.date), { start: clampedStart, end: clampedEnd })).reduce((s, i) => s + i.amount, 0);
        const wExpense = periodExpenses.filter(e => isWithinInterval(new Date(e.date), { start: clampedStart, end: clampedEnd })).reduce((s, e) => s + e.amount, 0);
        return {
          label: `W${idx + 1}`,
          fullLabel: `${format(clampedStart, 'MMM d')} - ${format(clampedEnd, 'MMM d')}`,
          income: wIncome,
          expenses: wExpense,
        };
      });
    }

    return { chartData: data, totalIncome, totalExpenses, netFlow: totalIncome - totalExpenses };
  }, [expenses, incomes, periodType, currentDate]);

  const hasData = chartData.some(d => d.income > 0 || d.expenses > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="font-medium text-foreground text-sm">{data.fullLabel}</p>
          <p className="text-sm text-emerald-500">Income: ₵{data.income.toFixed(2)}</p>
          <p className="text-sm text-destructive">Expenses: ₵{data.expenses.toFixed(2)}</p>
          <p className={`text-xs font-medium mt-1 ${data.income - data.expenses >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
            Net: ₵{(data.income - data.expenses).toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card rounded-3xl p-7 shadow-sm border border-border/50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
          <Scale className="h-4 w-4 text-primary" />
          Spending vs Income
        </h3>
      </div>

      {/* Summary row */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">₵{totalIncome.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
          <span className="text-muted-foreground">₵{totalExpenses.toFixed(2)}</span>
        </div>
        <div className={`ml-auto flex items-center gap-1 font-medium ${netFlow >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
          {netFlow >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          <span>₵{Math.abs(netFlow).toFixed(2)}</span>
        </div>
      </div>

      {!hasData ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          No data to display
        </div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
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
                tickFormatter={(v) => `₵${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income" radius={[4, 4, 0, 0]} maxBarSize={24} fill="#10b981" />
              <Bar dataKey="expenses" radius={[4, 4, 0, 0]} maxBarSize={24} fill="hsl(var(--destructive))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
