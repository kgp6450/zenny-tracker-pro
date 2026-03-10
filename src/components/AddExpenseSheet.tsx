import { useState, useRef, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { haptic } from '@/hooks/useHapticFeedback';
import { AddCategoryDialog } from '@/components/AddCategoryDialog';
import { CustomCategory } from '@/hooks/useCategories';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface AddExpenseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (expense: { amount: number; category: string; date: string; time: string; note?: string }) => void;
  categories: CustomCategory[];
  onAddCategory: (name: string, icon: string) => Promise<any>;
  mostUsedCategory?: string;
}

export const AddExpenseSheet = ({ open, onOpenChange, onAdd, categories, onAddCategory, mostUsedCategory }: AddExpenseSheetProps) => {
  const defaultCategory = mostUsedCategory || (categories.length > 0 ? categories[0].name : 'Food');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{ amount?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Reset form when opening
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setTime(format(new Date(), 'HH:mm'));
      setCategory(defaultCategory);
      setShowDetails(false);
    }
    onOpenChange(newOpen);
  };

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
      setCategory(defaultCategory);
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setTime(format(new Date(), 'HH:mm'));
      setNote('');
      setErrors({});
      setIsSubmitting(false);
      setShowDetails(false);
      buttonRef.current?.classList.remove('confirm-pulse');
      onOpenChange(false);
    }, 300);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
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
              <p className="text-sm text-destructive animate-fade-in">{errors.amount}</p>
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
                    "category-badge px-4 py-2 text-sm transition-all duration-150 transform-gpu press-effect",
                    category === cat.name && "ring-2 ring-offset-2 ring-primary scale-105"
                  )}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
              <AddCategoryDialog onAdd={onAddCategory} />
            </div>
          </div>

          {/* Progressive Disclosure: Date, Time & Note */}
          <Collapsible open={showDetails} onOpenChange={setShowDetails}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors press-effect w-full justify-center py-2 rounded-xl hover:bg-muted/50">
              <span>{showDetails ? 'Hide details' : 'Add details (date, time, note)'}</span>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform duration-200",
                showDetails && "rotate-180"
              )} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
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
            </CollapsibleContent>
          </Collapsible>

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
