import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const NotificationSettings = () => {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('20:00');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);

  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
      
      // Fetch VAPID public key
      supabase.functions.invoke('get-vapid-key').then(({ data, error }) => {
        if (!error && data?.publicKey) {
          setVapidPublicKey(data.publicKey);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!user || !isOpen) return;
    
    const fetchSubscription = async () => {
      // Use edge function to get subscription status (no sensitive data exposed)
      const { data, error } = await supabase.functions.invoke('manage-push-subscription', {
        body: { action: 'get-status' },
      });
      
      if (!error && data) {
        setIsSubscribed(data.subscribed);
        setReminderEnabled(data.reminder_enabled);
        setReminderTime(data.reminder_time || '20:00');
      }
    };

    fetchSubscription();
  }, [user, isOpen]);

  const subscribeToNotifications = useCallback(async () => {
    if (!user || !vapidPublicKey) return;
    
    setIsLoading(true);
    try {
      // Request permission
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result !== 'granted') {
        toast.error('Notification permission denied');
        return;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const subscriptionJson = subscription.toJSON();
      
      // Save via edge function (sensitive keys never exposed to client-side storage)
      const { data, error } = await supabase.functions.invoke('manage-push-subscription', {
        body: {
          action: 'subscribe',
          endpoint: subscription.endpoint,
          p256dh: subscriptionJson.keys?.p256dh || '',
          auth: subscriptionJson.keys?.auth || '',
          reminder_time: reminderTime + ':00',
          reminder_enabled: reminderEnabled,
        },
      });

      if (error || !data?.success) {
        throw new Error(error?.message || 'Failed to save subscription');
      }

      setIsSubscribed(true);
      toast.success('Notifications enabled!');
    } catch (error) {
      console.error('Failed to subscribe:', error);
      toast.error('Failed to enable notifications');
    } finally {
      setIsLoading(false);
    }
  }, [user, reminderTime, reminderEnabled, vapidPublicKey]);

  const unsubscribeFromNotifications = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
      }

      const { data, error } = await supabase.functions.invoke('manage-push-subscription', {
        body: { action: 'unsubscribe' },
      });

      if (error || !data?.success) {
        throw new Error(error?.message || 'Failed to unsubscribe');
      }

      setIsSubscribed(false);
      toast.success('Notifications disabled');
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      toast.error('Failed to disable notifications');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updateSettings = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-push-subscription', {
        body: {
          action: 'update',
          reminder_time: reminderTime + ':00',
          reminder_enabled: reminderEnabled,
        },
      });

      if (error || !data?.success) {
        throw new Error(error?.message || 'Failed to update settings');
      }
      
      toast.success('Settings updated');
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  }, [user, reminderTime, reminderEnabled]);

  if (!isSupported) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          {isSubscribed ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Notification Settings</SheetTitle>
          <SheetDescription>
            Get daily reminders to log your expenses
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {permission === 'denied' ? (
            <div className="text-sm text-destructive">
              Notifications are blocked. Please enable them in your browser settings.
            </div>
          ) : !isSubscribed ? (
            <Button
              onClick={subscribeToNotifications}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Bell className="h-4 w-4 mr-2" />
              )}
              Enable Notifications
            </Button>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Daily Reminder</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded to log your expenses
                  </p>
                </div>
                <Switch
                  checked={reminderEnabled}
                  onCheckedChange={(checked) => {
                    setReminderEnabled(checked);
                  }}
                />
              </div>

              {reminderEnabled && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Reminder Time
                  </Label>
                  <Input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={updateSettings}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Save Settings
                </Button>
                <Button
                  variant="outline"
                  onClick={unsubscribeFromNotifications}
                  disabled={isLoading}
                >
                  Disable
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
