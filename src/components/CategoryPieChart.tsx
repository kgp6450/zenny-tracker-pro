import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface CategoryPieChartProps {
  categoryTotals: Record<string, number>;
  onCategoryClick?: (categoryName: string) => void;
}

// Generate a consistent color based on category name
const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'Food': 'hsl(28, 65%, 58%)',
    'Transport': 'hsl(220, 50%, 60%)',
    'Entertainment': 'hsl(270, 40%, 60%)',
    'Bills': 'hsl(0, 50%, 60%)',
    'Other': 'hsl(170, 40%, 50%)',
  };
  
  if (colors[category]) return colors[category];
  
  // Generate color from string hash for custom categories
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 45%, 58%)`;
};

export const CategoryPieChart = ({ categoryTotals, onCategoryClick }: CategoryPieChartProps) => {
  const data = Object.entries(categoryTotals)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({
      name,
      value,
      color: getCategoryColor(name),
    }));

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

  const handlePieClick = (data: any) => {
    if (onCategoryClick && data?.name) {
      onCategoryClick(data.name);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="font-medium text-foreground">
            {data.name}
          </p>
          <p className="text-sm text-muted-foreground">
            ₵{data.value.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({percentage}%)
          </p>
          {onCategoryClick && (
            <p className="text-xs text-primary mt-1">Tap to view expenses</p>
          )}
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
            <button 
              key={`legend-${index}`}
              className="flex items-center gap-1.5 text-xs hover:opacity-70 transition-opacity cursor-pointer"
              onClick={() => onCategoryClick?.(entry.value)}
            >
              <div 
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">
                {entry.value} ({percentage}%)
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm">
      <h3 className="font-display font-semibold text-foreground mb-2">Spending Breakdown</h3>
      <p className="text-xs text-muted-foreground mb-2">Tap a category to view expenses</p>
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
              onClick={handlePieClick}
              style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
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
            <Legend content={renderCustomLegend} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};