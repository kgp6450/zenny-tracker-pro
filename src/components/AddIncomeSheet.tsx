import { useState, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { haptic } from '@/hooks/useHapticFeedback';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const INCOME_SOURCES = [
  { name: 'Salary', icon: '💰' },
  { name: 'Freelance', icon: '💻' },
  { name: 'Investment', icon: '📈' },
  { name: 'Gift', icon: '🎁' },
  { name: 'Refund', icon: '🔄' },
  { name: 'Other', icon: '📦' },
];

interface AddIncomeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (income: { amount: number; source: string; date: string; note?: string }) => void;
}

export const AddIncomeSheet = ({ open, onOpenChange, onAdd }: AddIncomeSheetProps) => {
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('Salary');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{ amount?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setDate(format(new Date(), 'yyyy-MM-dd'));
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

    haptic.success();
    setIsSubmitting(true);
    buttonRef.current?.classList.add('confirm-pulse');

    onAdd({
      amount: parsedAmount,
      source,
      date,
      note: note.trim() || undefined,
    });

    setTimeout(() => {
      setAmount('');
      setSource('Salary');
      setDate(format(new Date(), 'yyyy-MM-dd'));
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
          <SheetTitle className="font-display text-xl">Add Income</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="income-amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-medium text-muted-foreground">
                ₵
              </span>
              <Input
                id="income-amount"
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

          {/* Source */}
          <div className="space-y-2">
            <Label>Source</Label>
            <div className="flex flex-wrap gap-2">
              {INCOME_SOURCES.map((src) => (
                <button
                  key={src.name}
                  type="button"
                  onClick={() => {
                    haptic.light();
                    setSource(src.name);
                  }}
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

          {/* Progressive Disclosure: Date & Note */}
          <Collapsible open={showDetails} onOpenChange={setShowDetails}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors press-effect w-full justify-center py-2 rounded-xl hover:bg-muted/50">
              <span>{showDetails ? 'Hide details' : 'Add details (date, note)'}</span>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform duration-200",
                showDetails && "rotate-180"
              )} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="income-date">Date</Label>
                <Input
                  id="income-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="income-note">Note (optional)</Label>
                <Textarea
                  id="income-note"
                  placeholder="What is this income from?"
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
            {isSubmitting ? 'Adding...' : 'Add Income'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
};
