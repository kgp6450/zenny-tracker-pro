import { useMemo } from 'react';
import { Heart, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Expense } from '@/types/expense';
import { 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear,
  subMonths, isWithinInterval, differenceInDays
} from 'date-fns';
import { PeriodType } from './PeriodNavigator';

interface FinancialHealthIndicatorsProps {
  expenses: Expense[];
  periodType: PeriodType;
  currentDate: Date;
}

type HealthLevel = 'excellent' | 'good' | 'caution' | 'warning';

const healthColors: Record<HealthLevel, string> = {
  excellent: 'text-emerald-500',
  good: 'text-primary',
  caution: 'text-amber-500',
  warning: 'text-destructive',
};

const healthBg: Record<HealthLevel, string> = {
  excellent: 'bg-emerald-500',
  good: 'bg-primary',
  caution: 'bg-amber-500',
  warning: 'bg-destructive',
};

export const FinancialHealthIndicators = ({ expenses, periodType, currentDate }: FinancialHealthIndicatorsProps) => {
  const indicators = useMemo(() => {
    const getPeriodBounds = (date: Date, type: PeriodType) => {
      switch (type) {
        case 'week':
          return { start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) };
        case 'year':
          return { start: startOfYear(date), end: endOfYear(date) };
        default:
          return { start: startOfMonth(date), end: endOfMonth(date) };
      }
    };

    const current = getPeriodBounds(currentDate, periodType);
    const prevDate = periodType === 'week' 
      ? new Date(currentDate.getTime() - 7 * 86400000)
      : periodType === 'year' ? subMonths(currentDate, 12) : subMonths(currentDate, 1);
    const prev = getPeriodBounds(prevDate, periodType);

    const currentExpenses = expenses.filter(e => isWithinInterval(new Date(e.date), current));
    const prevExpenses = expenses.filter(e => isWithinInterval(new Date(e.date), prev));

    const currentTotal = currentExpenses.reduce((s, e) => s + e.amount, 0);
    const prevTotal = prevExpenses.reduce((s, e) => s + e.amount, 0);

    const daysInPeriod = differenceInDays(current.end, current.start) + 1;
    const today = new Date();
    const daysElapsed = Math.min(Math.max(differenceInDays(today, current.start) + 1, 1), daysInPeriod);

    // 1. Spending Consistency (how even is daily spending)
    const dailyTotals: Record<string, number> = {};
    currentExpenses.forEach(e => {
      dailyTotals[e.date] = (dailyTotals[e.date] || 0) + e.amount;
    });
    const dailyAmounts = Object.values(dailyTotals);
    const avgDaily = currentTotal / daysElapsed;
    const variance = dailyAmounts.length > 1
      ? dailyAmounts.reduce((s, v) => s + Math.pow(v - avgDaily, 2), 0) / dailyAmounts.length
      : 0;
    const cv = avgDaily > 0 ? Math.sqrt(variance) / avgDaily : 0;
    const consistencyScore = Math.max(0, Math.min(100, 100 - cv * 50));
    const consistencyLevel: HealthLevel = consistencyScore >= 75 ? 'excellent' : consistencyScore >= 50 ? 'good' : consistencyScore >= 25 ? 'caution' : 'warning';

    // 2. Spending Trend (vs previous period, normalized by days elapsed)
    const normalizedCurrent = currentTotal / daysElapsed;
    const normalizedPrev = prevTotal / daysInPeriod;
    const trendPct = normalizedPrev > 0 ? ((normalizedCurrent - normalizedPrev) / normalizedPrev) * 100 : 0;
    const trendLevel: HealthLevel = trendPct <= -10 ? 'excellent' : trendPct <= 5 ? 'good' : trendPct <= 20 ? 'caution' : 'warning';
    const trendScore = Math.max(0, Math.min(100, 100 - trendPct * 2));

    // 3. Category Diversity (more spread = healthier tracking)
    const categories = new Set(currentExpenses.map(e => e.category));
    const catCount = categories.size;
    const diversityScore = Math.min(100, catCount * 20);
    const diversityLevel: HealthLevel = catCount >= 5 ? 'excellent' : catCount >= 3 ? 'good' : catCount >= 2 ? 'caution' : 'warning';

    // 4. Tracking Frequency (days with at least one expense)
    const activeDays = Object.keys(dailyTotals).length;
    const trackingRate = (activeDays / daysElapsed) * 100;
    const trackingLevel: HealthLevel = trackingRate >= 70 ? 'excellent' : trackingRate >= 40 ? 'good' : trackingRate >= 20 ? 'caution' : 'warning';

    // Overall health score
    const overallScore = Math.round((consistencyScore + trendScore + diversityScore + trackingRate) / 4);
    const overallLevel: HealthLevel = overallScore >= 70 ? 'excellent' : overallScore >= 50 ? 'good' : overallScore >= 30 ? 'caution' : 'warning';

    return {
      consistency: { score: Math.round(consistencyScore), level: consistencyLevel, label: 'Consistency' },
      trend: { score: Math.round(trendScore), level: trendLevel, label: 'Spending Trend', pct: trendPct },
      diversity: { score: Math.round(diversityScore), level: diversityLevel, label: 'Category Spread', count: catCount },
      tracking: { score: Math.round(trackingRate), level: trackingLevel, label: 'Tracking Habit', days: activeDays, total: daysElapsed },
      overall: { score: overallScore, level: overallLevel },
    };
  }, [expenses, periodType, currentDate]);

  const HealthIcon = ({ level }: { level: HealthLevel }) => {
    switch (level) {
      case 'excellent': return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />;
      case 'good': return <CheckCircle className="h-3.5 w-3.5 text-primary" />;
      case 'caution': return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
      case 'warning': return <AlertTriangle className="h-3.5 w-3.5 text-destructive" />;
    }
  };

  return (
    <Card className="border-0 shadow-md bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            Financial Health
          </div>
          <div className={`flex items-center gap-1.5 text-sm font-medium ${healthColors[indicators.overall.level]}`}>
            <span>{indicators.overall.score}/100</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Overall Progress Bar */}
        <div className="relative">
          <Progress value={indicators.overall.score} className="h-2" />
        </div>

        {/* Individual Indicators */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Consistency */}
          <div className="bg-muted/50 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{indicators.consistency.label}</span>
              <HealthIcon level={indicators.consistency.level} />
            </div>
            <div className="flex items-end gap-1">
              <span className="text-lg font-semibold text-foreground">{indicators.consistency.score}</span>
              <span className="text-xs text-muted-foreground mb-0.5">/100</span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${healthBg[indicators.consistency.level]}`} style={{ width: `${indicators.consistency.score}%` }} />
            </div>
          </div>

          {/* Trend */}
          <div className="bg-muted/50 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{indicators.trend.label}</span>
              {indicators.trend.pct > 0 ? <TrendingUp className="h-3.5 w-3.5 text-destructive" /> : indicators.trend.pct < 0 ? <TrendingDown className="h-3.5 w-3.5 text-emerald-500" /> : <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>
            <div className="flex items-end gap-1">
              <span className="text-lg font-semibold text-foreground">{indicators.trend.pct > 0 ? '+' : ''}{indicators.trend.pct.toFixed(0)}%</span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${healthBg[indicators.trend.level]}`} style={{ width: `${indicators.trend.score}%` }} />
            </div>
          </div>

          {/* Category Diversity */}
          <div className="bg-muted/50 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{indicators.diversity.label}</span>
              <HealthIcon level={indicators.diversity.level} />
            </div>
            <div className="flex items-end gap-1">
              <span className="text-lg font-semibold text-foreground">{indicators.diversity.count}</span>
              <span className="text-xs text-muted-foreground mb-0.5">categories</span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${healthBg[indicators.diversity.level]}`} style={{ width: `${indicators.diversity.score}%` }} />
            </div>
          </div>

          {/* Tracking Habit */}
          <div className="bg-muted/50 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{indicators.tracking.label}</span>
              <HealthIcon level={indicators.tracking.level} />
            </div>
            <div className="flex items-end gap-1">
              <span className="text-lg font-semibold text-foreground">{indicators.tracking.days}</span>
              <span className="text-xs text-muted-foreground mb-0.5">/ {indicators.tracking.total} days</span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${healthBg[indicators.tracking.level]}`} style={{ width: `${indicators.tracking.score}%` }} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
