import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Income } from '@/hooks/useIncome';
import { TrendingUp } from 'lucide-react';

const SOURCE_COLORS: Record<string, string> = {
  Salary: 'hsl(142, 55%, 45%)',
  Freelance: 'hsl(210, 55%, 55%)',
  Investment: 'hsl(45, 65%, 50%)',
  Gift: 'hsl(330, 50%, 55%)',
  Refund: 'hsl(190, 50%, 50%)',
  Other: 'hsl(260, 40%, 55%)',
};

const getSourceColor = (source: string): string => {
  if (SOURCE_COLORS[source]) return SOURCE_COLORS[source];
  let hash = 0;
  for (let i = 0; i < source.length; i++) {
    hash = source.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360}, 45%, 55%)`;
};

interface IncomeSourcePieChartProps {
  incomes: Income[];
  currentDate: Date;
  periodType: 'week' | 'month' | 'year';
}

export const IncomeSourcePieChart = ({ incomes, currentDate, periodType }: IncomeSourcePieChartProps) => {
  const data = useMemo(() => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    const filtered = incomes.filter(i => {
      const d = new Date(i.date);
      if (periodType === 'month') return d.getMonth() === month && d.getFullYear() === year;
      if (periodType === 'year') return d.getFullYear() === year;
      // week
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return d >= startOfWeek && d <= endOfWeek;
    });

    const totals: Record<string, number> = {};
    filtered.forEach(i => {
      totals[i.source] = (totals[i.source] || 0) + i.amount;
    });

    return Object.entries(totals)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value, color: getSourceColor(name) }))
      .sort((a, b) => b.value - a.value);
  }, [incomes, currentDate, periodType]);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (data.length === 0) {
    return (
      <div className="bg-card rounded-3xl p-7 shadow-sm border border-border/50">
        <h3 className="font-display font-semibold text-foreground mb-4">Income Breakdown</h3>
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          No income to display
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const pct = ((d.value / total) * 100).toFixed(1);
      return (
        <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="font-medium text-foreground">{d.name}</p>
          <p className="text-sm text-muted-foreground">
            ₵{d.value.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({pct}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLegend = ({ payload }: any) => (
    <div className="flex flex-wrap justify-center gap-3 mt-4">
      {payload.map((entry: any, index: number) => {
        const item = data.find(d => d.name === entry.value);
        const pct = item ? ((item.value / total) * 100).toFixed(0) : 0;
        return (
          <div key={`legend-${index}`} className="flex items-center gap-1.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.value} ({pct}%)</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="bg-card rounded-3xl p-7 shadow-sm border border-border/50">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="font-display font-semibold text-foreground">Income Breakdown</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-2">By source this {periodType}</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  className="transition-all duration-300 hover:opacity-80"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={renderLegend} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
