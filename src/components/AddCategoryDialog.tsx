import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { haptic } from '@/hooks/useHapticFeedback';

const EMOJI_OPTIONS = [
  '🛒', '🏠', '💊', '👕', '🎁', '✈️', '📱', '💡',
  '🍕', '☕', '🎮', '📚', '🏋️', '💇', '🐕', '🌱',
  '💼', '🎓', '🏥', '🛠️', '🎨', '🎵', '🍷', '🧹',
];

interface AddCategoryDialogProps {
  onAdd: (name: string, icon: string) => Promise<any>;
  trigger?: React.ReactNode;
}

export const AddCategoryDialog = ({ onAdd, trigger }: AddCategoryDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter a category name');
      haptic.error();
      return;
    }

    setIsSubmitting(true);
    setError('');

    const result = await onAdd(name.trim(), icon);
    
    setIsSubmitting(false);

    if (result) {
      haptic.success();
      setName('');
      setIcon('📦');
      setOpen(false);
    } else {
      haptic.error();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button
            type="button"
            className="category-badge px-4 py-2 text-sm border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              placeholder="e.g., Groceries"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              maxLength={50}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    haptic.light();
                    setIcon(emoji);
                  }}
                  className={`w-10 h-10 text-xl rounded-lg flex items-center justify-center transition-all ${
                    icon === emoji
                      ? 'bg-primary/20 ring-2 ring-primary scale-110'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Adding...' : 'Add Category'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
