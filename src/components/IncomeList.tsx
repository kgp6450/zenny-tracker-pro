import { useState } from 'react';
import { TrendingUp, Trash2, Calendar, Search } from 'lucide-react';
import { Income } from '@/hooks/useIncome';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { haptic } from '@/hooks/useHapticFeedback';

const SOURCE_ICONS: Record<string, string> = {
  Salary: '💰',
  Freelance: '💻',
  Investment: '📈',
  Gift: '🎁',
  Refund: '🔄',
  Other: '📦',
};

interface IncomeListProps {
  incomes: Income[];
  onDelete: (id: string) => void;
  onEdit: (income: Income) => void;
  currentDate: Date;
  periodType: 'week' | 'month' | 'year';
}

export const IncomeList = ({ incomes, onDelete, currentDate, periodType }: IncomeListProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIncomes = incomes.filter(income => {
    const d = parseISO(income.date);
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    let inPeriod = false;
    if (periodType === 'month') {
      inPeriod = d.getMonth() === month && d.getFullYear() === year;
    } else if (periodType === 'year') {
      inPeriod = d.getFullYear() === year;
    } else {
      // week
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      inPeriod = d >= startOfWeek && d <= endOfWeek;
    }

    if (!inPeriod) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        income.source.toLowerCase().includes(q) ||
        (income.note && income.note.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalIncome = filteredIncomes.reduce((sum, i) => sum + i.amount, 0);

  const handleDelete = (id: string) => {
    haptic.warning();
    onDelete(id);
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-2xl bg-card border border-border p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Income</p>
            <p className="text-2xl font-display font-bold text-foreground">
              ₵{totalIncome.toFixed(2)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {filteredIncomes.length} {filteredIncomes.length === 1 ? 'entry' : 'entries'} this {periodType}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search income..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-11 rounded-xl"
        />
      </div>

      {/* List */}
      {filteredIncomes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No income records found</p>
          <p className="text-xs mt-1">Tap the + button to add income</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredIncomes.map((income) => (
            <div
              key={income.id}
              className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border transition-colors hover:bg-muted/50"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/50 flex items-center justify-center text-lg shrink-0">
                {SOURCE_ICONS[income.source] || '📦'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground truncate">{income.source}</p>
                  <p className="font-display font-semibold text-foreground shrink-0 ml-2">
                    +₵{income.amount.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{format(parseISO(income.date), 'MMM d, yyyy')}</span>
                  </div>
                  {income.note && (
                    <span className="text-xs text-muted-foreground truncate">• {income.note}</span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(income.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
