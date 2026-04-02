import { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Income } from '@/hooks/useIncome';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { haptic } from '@/hooks/useHapticFeedback';

const INCOME_SOURCES = [
  { name: 'Salary', icon: '💰' },
  { name: 'Freelance', icon: '💻' },
  { name: 'Investment', icon: '📈' },
  { name: 'Gift', icon: '🎁' },
  { name: 'Refund', icon: '🔄' },
  { name: 'Other', icon: '📦' },
];

interface EditIncomeSheetProps {
  income: Income | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: { amount: number; source: string; date: string; note?: string }) => void;
  onDelete: (id: string) => void;
}

export const EditIncomeSheet = ({ income, open, onOpenChange, onUpdate, onDelete }: EditIncomeSheetProps) => {
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('Salary');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{ amount?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (income) {
      setAmount(income.amount.toString());
      setSource(income.source);
      setDate(income.date);
      setNote(income.note || '');
      setErrors({});
    }
  }, [income]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!income) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      haptic.error();
      setErrors({ amount: 'Please enter a valid amount' });
      return;
    }

    haptic.success();
    setIsSubmitting(true);
    saveButtonRef.current?.classList.add('confirm-pulse');

    onUpdate(income.id, {
      amount: parsedAmount,
      source,
      date,
      note: note.trim() || undefined,
    });

    setTimeout(() => {
      setIsSubmitting(false);
      saveButtonRef.current?.classList.remove('confirm-pulse');
      onOpenChange(false);
    }, 300);
  };

  const handleDelete = () => {
    if (income) {
      haptic.warning();
      onDelete(income.id);
      onOpenChange(false);
    }
  };

  if (!income) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl h-auto max-h-[90vh]">
        <SheetHeader className="pb-4">
          <SheetTitle className="font-display text-xl">Edit Income</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="edit-income-amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-medium text-muted-foreground">₵</span>
              <Input
                id="edit-income-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setErrors({}); }}
                className={cn("pl-8 text-lg h-14 font-display", errors.amount && "border-destructive")}
              />
            </div>
            {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
          </div>

          <div className="space-y-2">
            <Label>Source</Label>
            <div className="flex flex-wrap gap-2">
              {INCOME_SOURCES.map((src) => (
                <button
                  key={src.name}
                  type="button"
                  onClick={() => { haptic.light(); setSource(src.name); }}
                  className={cn(
                    "category-badge px-4 py-2 text-sm transition-all duration-150 transform-gpu press-effect",
                    source === src.name && "ring-2 ring-offset-2 ring-primary scale-105"
                  )}
                >
                  <span>{src.icon}</span>
                  <span>{src.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-income-date">Date</Label>
            <Input
              id="edit-income-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-income-note">Note (optional)</Label>
            <Textarea
              id="edit-income-note"
              placeholder="What is this income from?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none"
              rows={2}
              maxLength={200}
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-14 text-base font-semibold text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
            >
              Delete
            </Button>
            <Button
              ref={saveButtonRef}
              type="submit"
              className="flex-1 h-14 text-base font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
