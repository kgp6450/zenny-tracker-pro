import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubscriptionRequest {
  action: 'subscribe' | 'unsubscribe' | 'update' | 'get-status';
  endpoint?: string;
  p256dh?: string;
  auth?: string;
  reminder_time?: string;
  reminder_enabled?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('Auth error:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;
    const body: SubscriptionRequest = await req.json();
    
    console.log(`Processing ${body.action} for user ${userId}`);

    // Use service role for database operations to bypass RLS on sensitive columns
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    switch (body.action) {
      case 'subscribe': {
        if (!body.endpoint || !body.p256dh || !body.auth) {
          return new Response(
            JSON.stringify({ error: 'Missing subscription data' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Validate inputs
        if (body.endpoint.length > 500 || body.p256dh.length > 200 || body.auth.length > 100) {
          return new Response(
            JSON.stringify({ error: 'Invalid subscription data' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabaseAdmin
          .from('push_subscriptions')
          .upsert({
            user_id: userId,
            endpoint: body.endpoint,
            p256dh: body.p256dh,
            auth: body.auth,
            reminder_time: body.reminder_time || '20:00:00',
            reminder_enabled: body.reminder_enabled ?? true,
          }, {
            onConflict: 'user_id',
          });

        if (error) {
          console.error('Subscribe error:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to save subscription' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Subscription saved for user ${userId}`);
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'unsubscribe': {
        const { error } = await supabaseAdmin
          .from('push_subscriptions')
          .delete()
          .eq('user_id', userId);

        if (error) {
          console.error('Unsubscribe error:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to remove subscription' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Subscription removed for user ${userId}`);
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update': {
        const { error } = await supabaseAdmin
          .from('push_subscriptions')
          .update({
            reminder_time: body.reminder_time,
            reminder_enabled: body.reminder_enabled,
          })
          .eq('user_id', userId);

        if (error) {
          console.error('Update error:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to update settings' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Settings updated for user ${userId}`);
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-status': {
        // Only return non-sensitive data
        const { data, error } = await supabaseAdmin
          .from('push_subscriptions')
          .select('reminder_enabled, reminder_time')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          console.error('Get status error:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to get status' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ 
            subscribed: !!data,
            reminder_enabled: data?.reminder_enabled ?? true,
            reminder_time: data?.reminder_time?.slice(0, 5) ?? '20:00',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
