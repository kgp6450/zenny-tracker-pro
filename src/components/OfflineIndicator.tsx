import { WifiOff, CloudOff, Loader2 } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  pendingCount?: number;
  isSyncing?: boolean;
}

export const OfflineIndicator = ({ pendingCount = 0, isSyncing = false }: OfflineIndicatorProps) => {
  const isOnline = useOnlineStatus();

  // Show syncing indicator
  if (isOnline && isSyncing) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-primary/90 text-primary-foreground py-2 px-4 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm font-medium">Syncing changes...</span>
      </div>
    );
  }

  // Show pending changes when back online
  if (isOnline && pendingCount > 0) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-accent text-accent-foreground py-2 px-4 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300">
        <CloudOff className="w-4 h-4" />
        <span className="text-sm font-medium">
          {pendingCount} pending change{pendingCount > 1 ? 's' : ''} to sync
        </span>
      </div>
    );
  }

  // Show offline indicator
  if (!isOnline) {
    return (
      <div className={cn(
        "fixed top-0 left-0 right-0 z-50 py-2 px-4 flex items-center justify-center gap-2",
        "bg-destructive text-destructive-foreground",
        "animate-in slide-in-from-top duration-300"
      )}>
        <WifiOff className="w-4 h-4" />
        <span className="text-sm font-medium">
          You're offline
          {pendingCount > 0 && ` • ${pendingCount} change${pendingCount > 1 ? 's' : ''} pending`}
        </span>
      </div>
    );
  }

  return null;
};
