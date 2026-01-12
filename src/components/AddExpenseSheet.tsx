import { useState, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Category, CATEGORIES } from '@/types/expense';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { haptic } from '@/hooks/useHapticFeedback';

interface AddExpenseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (expense: { amount: number; category: Category; date: string; time: string; note?: string }) => void;
}

export const AddExpenseSheet = ({ open, onOpenChange, onAdd }: AddExpenseSheetProps) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('food');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{ amount?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      haptic.error();
      setErrors({ amount: 'Please enter a valid amount' });
      return;
    }

    // Trigger confirmation pulse and haptic
    haptic.success();
    setIsSubmitting(true);
    buttonRef.current?.classList.add('confirm-pulse');

    onAdd({
      amount: parsedAmount,
      category,
      date,
      time,
      note: note.trim() || undefined,
    });

    // Reset form after animation
    setTimeout(() => {
      setAmount('');
      setCategory('food');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setTime(format(new Date(), 'HH:mm'));
      setNote('');
      setErrors({});
      setIsSubmitting(false);
      buttonRef.current?.classList.remove('confirm-pulse');
      onOpenChange(false);
    }, 300);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl h-auto max-h-[90vh]">
        <SheetHeader className="pb-4">
          <SheetTitle className="font-display text-xl">Add Expense</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-medium text-muted-foreground">
                ₵
              </span>
              <Input
                id="amount"
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
                autoFocus
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
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => {
                    haptic.light();
                    setCategory(cat.value);
                  }}
                  className={cn(
                    "category-badge px-4 py-2 text-sm transition-all duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform-gpu press-effect",
                    `category-${cat.value}`,
                    category === cat.value && "ring-2 ring-offset-2 ring-primary scale-105"
                  )}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-12"
              />
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              placeholder="What was this expense for?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none"
              rows={2}
              maxLength={200}
            />
          </div>

          {/* Submit */}
          <Button 
            ref={buttonRef}
            type="submit" 
            className="w-full h-14 text-base font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Expense'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
};
