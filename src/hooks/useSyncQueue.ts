import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QueuedAction {
  id: string;
  type: 'add' | 'update' | 'delete';
  payload: Record<string, unknown>;
  timestamp: number;
}

const QUEUE_KEY = 'expense_sync_queue';

const loadQueue = (): QueuedAction[] => {
  try {
    const stored = localStorage.getItem(QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveQueue = (queue: QueuedAction[]) => {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const useSyncQueue = (userId: string | undefined, onSyncComplete: () => void) => {
  const [queue, setQueue] = useState<QueuedAction[]>(loadQueue);
  const [isSyncing, setIsSyncing] = useState(false);

  const pendingCount = queue.length;

  const addToQueue = useCallback((action: Omit<QueuedAction, 'id' | 'timestamp'>) => {
    const newAction: QueuedAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setQueue(prev => {
      const updated = [...prev, newAction];
      saveQueue(updated);
      return updated;
    });
  }, []);

  const processQueue = useCallback(async () => {
    if (!userId || queue.length === 0 || isSyncing) return;

    setIsSyncing(true);
    const actionsToProcess = [...queue];
    const failedActions: QueuedAction[] = [];
    let successCount = 0;

    for (const action of actionsToProcess) {
      try {
        switch (action.type) {
          case 'add': {
            const { error } = await supabase.from('expenses').insert({
              user_id: userId,
              amount: action.payload.amount as number,
              category: action.payload.category as string,
              date: action.payload.date as string,
              time: action.payload.time as string,
              note: (action.payload.note as string) || null,
            });
            if (error) throw error;
            successCount++;
            break;
          }
          case 'update': {
            const { error } = await supabase
              .from('expenses')
              .update({
                amount: action.payload.amount as number,
                category: action.payload.category as string,
                date: action.payload.date as string,
                time: action.payload.time as string,
                note: (action.payload.note as string) || null,
              })
              .eq('id', action.payload.id as string);
            if (error) throw error;
            successCount++;
            break;
          }
          case 'delete': {
            const { error } = await supabase
              .from('expenses')
              .delete()
              .eq('id', action.payload.id as string);
            if (error) throw error;
            successCount++;
            break;
          }
        }
      } catch (error) {
        console.error('Sync failed for action:', action, error);
        failedActions.push(action);
      }
    }

    setQueue(failedActions);
    saveQueue(failedActions);
    setIsSyncing(false);

    if (successCount > 0) {
      toast.success(`Synced ${successCount} offline change${successCount > 1 ? 's' : ''}`);
      onSyncComplete();
    }
    if (failedActions.length > 0) {
      toast.error(`Failed to sync ${failedActions.length} change${failedActions.length > 1 ? 's' : ''}`);
    }
  }, [userId, queue, isSyncing, onSyncComplete]);

  // Sync when coming back online
  useEffect(() => {
    const handleOnline = () => {
      if (queue.length > 0) {
        processQueue();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [queue, processQueue]);

  // Try to sync on mount if online and has pending items
  useEffect(() => {
    if (navigator.onLine && queue.length > 0 && userId) {
      processQueue();
    }
  }, [userId]); // Only run on mount when userId changes

  return {
    addToQueue,
    processQueue,
    pendingCount,
    isSyncing,
  };
};
