import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Category, CATEGORIES, getCategoryInfo } from '@/types/expense';

interface CategoryPieChartProps {
  categoryTotals: Record<Category, number>;
}

const CATEGORY_COLORS: Record<Category, string> = {
  food: 'hsl(25, 90%, 55%)',
  transport: 'hsl(220, 75%, 55%)',
  entertainment: 'hsl(280, 65%, 55%)',
  bills: 'hsl(0, 72%, 55%)',
  other: 'hsl(168, 70%, 40%)',
};

export const CategoryPieChart = ({ categoryTotals }: CategoryPieChartProps) => {
  const data = CATEGORIES
    .map(cat => ({
      name: cat.label,
      value: categoryTotals[cat.value],
      icon: cat.icon,
      category: cat.value,
    }))
    .filter(item => item.value > 0);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (data.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-sm">
        <h3 className="font-display font-semibold text-foreground mb-4">Spending Breakdown</h3>
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          No expenses to display
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="font-medium text-foreground flex items-center gap-2">
            <span>{data.icon}</span>
            {data.name}
          </p>
          <p className="text-sm text-muted-foreground">
            ₵{data.value.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {payload.map((entry: any, index: number) => {
          const item = data.find(d => d.name === entry.value);
          const percentage = item ? ((item.value / total) * 100).toFixed(0) : 0;
          return (
            <div 
              key={`legend-${index}`}
              className="flex items-center gap-1.5 text-xs"
            >
              <div 
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">
                {item?.icon} {entry.value} ({percentage}%)
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm">
      <h3 className="font-display font-semibold text-foreground mb-2">Spending Breakdown</h3>
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
                  fill={CATEGORY_COLORS[entry.category]}
                  className="transition-all duration-300 hover:opacity-80"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={renderCustomLegend} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
