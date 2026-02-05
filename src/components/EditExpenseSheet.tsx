import { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Expense } from '@/types/expense';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { haptic } from '@/hooks/useHapticFeedback';
import { useCategories } from '@/hooks/useCategories';
import { AddCategoryDialog } from '@/components/AddCategoryDialog';

interface EditExpenseSheetProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<Omit<Expense, 'id' | 'createdAt'>>) => void;
  onDelete: (id: string) => void;
}

export const EditExpenseSheet = ({ expense, open, onOpenChange, onUpdate, onDelete }: EditExpenseSheetProps) => {
  const { categories, addCategory } = useCategories();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('12:00');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{ amount?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  // Populate form when expense changes
  useEffect(() => {
    if (expense) {
      setAmount(expense.amount.toString());
      setCategory(expense.category);
      setDate(expense.date);
      setTime(expense.time?.slice(0, 5) || '12:00');
      setNote(expense.note || '');
      setErrors({});
    }
  }, [expense]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!expense) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      haptic.error();
      setErrors({ amount: 'Please enter a valid amount' });
      return;
    }

    // Trigger confirmation pulse and haptic
    haptic.success();
    setIsSubmitting(true);
    saveButtonRef.current?.classList.add('confirm-pulse');

    onUpdate(expense.id, {
      amount: parsedAmount,
      category,
      date,
      time,
      note: note.trim() || undefined,
    });

    setTimeout(() => {
      setIsSubmitting(false);
      saveButtonRef.current?.classList.remove('confirm-pulse');
      onOpenChange(false);
    }, 300);
  };

  const handleDelete = () => {
    if (expense) {
      haptic.warning();
      onDelete(expense.id);
      onOpenChange(false);
    }
  };

  if (!expense) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl h-auto max-h-[90vh]">
        <SheetHeader className="pb-4">
          <SheetTitle className="font-display text-xl">Edit Expense</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="edit-amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-medium text-muted-foreground">
                ₵
              </span>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErrors({});
                }}
                className={cn(
                  "pl-8 text-lg h-14 font-display",
                  errors.amount && "border-destructive"
                )}
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    haptic.light();
                    setCategory(cat.name);
                  }}
                  className={cn(
                    "category-badge px-4 py-2 text-sm transition-all duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform-gpu press-effect",
                    category === cat.name && "ring-2 ring-offset-2 ring-primary scale-105"
                  )}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
              <AddCategoryDialog onAdd={addCategory} />
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-time">Time</Label>
              <Input
                id="edit-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-12"
              />
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="edit-note">Note (optional)</Label>
            <Textarea
              id="edit-note"
              placeholder="What was this expense for?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none"
              rows={2}
              maxLength={200}
            />
          </div>

          {/* Actions */}
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
