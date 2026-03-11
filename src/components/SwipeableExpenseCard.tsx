import { useState, useRef, useCallback } from 'react';
import { Expense } from '@/types/expense';
import { ExpenseCard } from './ExpenseCard';
import { haptic } from '@/hooks/useHapticFeedback';
import { Pencil, Trash2, Copy } from 'lucide-react';

interface SwipeableExpenseCardProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onDuplicate: (expense: Expense) => void;
}

const SWIPE_THRESHOLD = 70;
const MAX_SWIPE = 140;

export const SwipeableExpenseCard = ({ expense, onEdit, onDelete, onDuplicate }: SwipeableExpenseCardProps) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettled, setIsSettled] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const isHorizontal = useRef<boolean | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    currentX.current = offsetX;
    isHorizontal.current = null;
    setIsDragging(true);
    setIsSettled(false);
  }, [offsetX]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;

    const deltaX = e.touches[0].clientX - startX.current;
    const deltaY = e.touches[0].clientY - startY.current;

    // Determine direction on first significant move
    if (isHorizontal.current === null) {
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        isHorizontal.current = Math.abs(deltaX) > Math.abs(deltaY);
      }
      return;
    }

    if (!isHorizontal.current) return;

    e.preventDefault();
    const newOffset = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, currentX.current + deltaX));
    setOffsetX(newOffset);

    // Haptic at threshold
    if (Math.abs(newOffset) >= SWIPE_THRESHOLD && Math.abs(currentX.current + deltaX - deltaX * 0.1) < SWIPE_THRESHOLD) {
      haptic.light();
    }
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    isHorizontal.current = null;

    if (offsetX < -SWIPE_THRESHOLD) {
      // Swipe left - show edit/delete
      setOffsetX(-MAX_SWIPE);
      setIsSettled(true);
      haptic.medium();
    } else if (offsetX > SWIPE_THRESHOLD) {
      // Swipe right - show duplicate
      setOffsetX(MAX_SWIPE);
      setIsSettled(true);
      haptic.medium();
    } else {
      setOffsetX(0);
    }
  }, [offsetX]);

  const handleReset = useCallback(() => {
    setOffsetX(0);
    setIsSettled(false);
  }, []);

  const handleEdit = () => {
    haptic.light();
    handleReset();
    onEdit(expense);
  };

  const handleDelete = () => {
    haptic.warning();
    onDelete(expense.id);
  };

  const handleDuplicate = () => {
    haptic.success();
    handleReset();
    onDuplicate(expense);
  };

  const leftProgress = Math.min(1, Math.max(0, offsetX / SWIPE_THRESHOLD));
  const rightProgress = Math.min(1, Math.max(0, -offsetX / SWIPE_THRESHOLD));

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Right actions (revealed on swipe left) - Edit & Delete */}
      <div className="absolute inset-y-0 right-0 flex items-stretch">
        <button
          onClick={handleEdit}
          className="flex items-center justify-center w-[70px] bg-primary text-primary-foreground transition-opacity"
          style={{ opacity: rightProgress }}
        >
          <div className="flex flex-col items-center gap-1">
            <Pencil className="w-4 h-4" />
            <span className="text-[10px] font-medium">Edit</span>
          </div>
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center justify-center w-[70px] bg-destructive text-destructive-foreground transition-opacity"
          style={{ opacity: rightProgress }}
        >
          <div className="flex flex-col items-center gap-1">
            <Trash2 className="w-4 h-4" />
            <span className="text-[10px] font-medium">Delete</span>
          </div>
        </button>
      </div>

      {/* Left action (revealed on swipe right) - Duplicate */}
      <div className="absolute inset-y-0 left-0 flex items-stretch">
        <button
          onClick={handleDuplicate}
          className="flex items-center justify-center w-[140px] bg-accent text-accent-foreground transition-opacity"
          style={{ opacity: leftProgress }}
        >
          <div className="flex flex-col items-center gap-1">
            <Copy className="w-4 h-4" />
            <span className="text-[10px] font-medium">Duplicate</span>
          </div>
        </button>
      </div>

      {/* Main card */}
      <div
        className="relative bg-card z-10"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <ExpenseCard expense={expense} onEdit={isSettled ? handleReset : onEdit} />
      </div>
    </div>
  );
};
