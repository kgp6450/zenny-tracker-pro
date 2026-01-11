import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.90.0';
import * as webpush from 'https://esm.sh/web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;

    // Set VAPID details
    webpush.setVapidDetails(
      'mailto:support@expensetracker.app',
      vapidPublicKey,
      vapidPrivateKey
    );

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the current hour (UTC)
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();

    console.log(`Running notification check at ${currentHour}:${currentMinute} UTC`);

    // Fetch all active subscriptions where reminder is enabled
    // Match subscriptions where reminder_time hour matches current hour
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('reminder_enabled', true);

    if (error) {
      console.error('Error fetching subscriptions:', error);
      throw error;
    }

    console.log(`Found ${subscriptions?.length || 0} active subscriptions`);

    const results = [];

    for (const subscription of subscriptions || []) {
      // Parse reminder time (stored as HH:MM:SS)
      const [hours] = subscription.reminder_time.split(':').map(Number);
      
      // Check if it's time to send (match the hour)
      // Note: In production, you'd want to handle timezones properly
      if (hours !== currentHour) {
        continue;
      }

      // Only send at the start of the hour (first 5 minutes)
      if (currentMinute > 5) {
        continue;
      }

      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };

      const payload = JSON.stringify({
        title: 'Expense Tracker',
        body: "Don't forget to log your expenses today! 💰",
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'expense-reminder',
      });

      try {
        await webpush.sendNotification(pushSubscription, payload);
        console.log(`Notification sent to user ${subscription.user_id}`);
        results.push({ userId: subscription.user_id, status: 'sent' });
      } catch (pushError: unknown) {
        console.error(`Failed to send to user ${subscription.user_id}:`, pushError);
        
        // If subscription is invalid, remove it
        const error = pushError as { statusCode?: number };
        if (error.statusCode === 410 || error.statusCode === 404) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', subscription.id);
          console.log(`Removed invalid subscription ${subscription.id}`);
        }
        
        results.push({ userId: subscription.user_id, status: 'failed', error: String(pushError) });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in send-notifications:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
