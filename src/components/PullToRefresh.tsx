import { useState, useRef, useCallback, useEffect } from 'react';
import { haptic } from '@/hooks/useHapticFeedback';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

export const PullToRefresh = ({ onRefresh, children }: PullToRefreshProps) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggeredHaptic = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only enable pull-to-refresh when scrolled to top
    if (window.scrollY > 0 || isRefreshing) return;
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
    triggeredHaptic.current = false;
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || isRefreshing) return;
    
    const deltaY = e.touches[0].clientY - startY.current;
    if (deltaY < 0) return;

    // Apply resistance
    const resistance = Math.min(1, deltaY / 300);
    const pull = Math.min(MAX_PULL, deltaY * resistance);
    setPullDistance(pull);

    if (pull >= PULL_THRESHOLD && !triggeredHaptic.current) {
      haptic.medium();
      triggeredHaptic.current = true;
    }
  }, [isDragging, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(60);
      haptic.success();

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isDragging, pullDistance, isRefreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(1, pullDistance / PULL_THRESHOLD);
  const rotation = pullDistance * 3;

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center z-20 pointer-events-none overflow-hidden"
        style={{
          height: `${pullDistance}px`,
          top: 0,
          transition: isDragging ? 'none' : 'height 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div
          className="flex flex-col items-center gap-1"
          style={{
            opacity: progress,
            transform: `scale(${0.5 + progress * 0.5})`,
            transition: isDragging ? 'none' : 'all 0.3s ease-out',
          }}
        >
          <div
            className="text-3xl"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.3s ease-out',
            }}
          >
            {isRefreshing ? '🔄' : pullDistance >= PULL_THRESHOLD ? '💰' : '🪙'}
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {isRefreshing ? 'Syncing...' : pullDistance >= PULL_THRESHOLD ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {children}
      </div>
    </div>
  );
};
