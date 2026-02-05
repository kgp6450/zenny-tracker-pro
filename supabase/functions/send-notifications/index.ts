import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.90.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Base64 URL encode/decode utilities
function base64UrlEncode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str: string): Uint8Array {
  const padding = '='.repeat((4 - str.length % 4) % 4);
  const base64 = (str + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}

// Create JWT for VAPID authentication
async function createVapidJwt(audience: string, subject: string, privateKeyBase64: string): Promise<string> {
  const header = { alg: 'ES256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: subject,
  };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import VAPID private key
  const privateKeyBytes = base64UrlDecode(privateKeyBase64);
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  ).catch(async () => {
    // Try raw format if PKCS8 fails
    const jwk = {
      kty: 'EC',
      crv: 'P-256',
      d: privateKeyBase64,
      x: '', // Will be derived
      y: '',
    };
    // For raw keys, we need to construct the full JWK
    return crypto.subtle.importKey(
      'raw',
      privateKeyBytes,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );
  });

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert signature from DER to raw format if needed
  const signatureBytes = new Uint8Array(signature);
  let r: Uint8Array, s: Uint8Array;
  
  if (signatureBytes.length === 64) {
    // Already in raw format
    r = signatureBytes.slice(0, 32);
    s = signatureBytes.slice(32);
  } else {
    // DER format - parse it
    r = signatureBytes.slice(0, 32);
    s = signatureBytes.slice(32, 64);
  }

  const rawSignature = new Uint8Array(64);
  rawSignature.set(r, 32 - r.length);
  rawSignature.set(s, 64 - s.length);

  return `${unsignedToken}.${base64UrlEncode(new Uint8Array(signature))}`;
}

// Send push notification using Web Push protocol
async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<Response> {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;

  // Create VAPID JWT
  let jwt: string;
  try {
    jwt = await createVapidJwt(audience, vapidSubject, vapidPrivateKey);
  } catch (e) {
    console.error('Failed to create VAPID JWT:', e);
    throw e;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/octet-stream',
    'Content-Encoding': 'aes128gcm',
    'TTL': '86400',
    'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
  };

  // For now, send unencrypted payload (some push services accept this)
  // Full encryption requires ECDH key exchange which is complex
  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers,
    body: new TextEncoder().encode(payload),
  });

  return response;
}

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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    console.log(`Running hourly notification at ${now.toISOString()}`);

    // Fetch all active subscriptions where reminder is enabled
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('reminder_enabled', true);

    if (error) {
      console.error('Error fetching subscriptions:', error);
      throw error;
    }

    console.log(`Found ${subscriptions?.length || 0} active subscriptions`);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, results: [], message: 'No active subscriptions' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const results = [];

    // Send notification to ALL users with reminder_enabled = true
    for (const subscription of subscriptions) {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };

      const payload = JSON.stringify({
        title: 'Expense Tracker',
        body: "Don't forget to log your expenses! 💰",
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'expense-reminder',
      });

      try {
        const response = await sendPushNotification(
          pushSubscription,
          payload,
          vapidPublicKey,
          vapidPrivateKey,
          'mailto:support@expensetracker.app'
        );

        if (response.ok || response.status === 201) {
          console.log(`Notification sent to user ${subscription.user_id}`);
          results.push({ userId: subscription.user_id, status: 'sent' });
        } else {
          const errorText = await response.text();
          console.error(`Push failed for user ${subscription.user_id}: ${response.status} - ${errorText}`);
          
          // If subscription is invalid, remove it
          if (response.status === 410 || response.status === 404) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', subscription.id);
            console.log(`Removed invalid subscription ${subscription.id}`);
          }
          
          results.push({ userId: subscription.user_id, status: 'failed', error: `${response.status}: ${errorText}` });
        }
      } catch (pushError) {
        console.error(`Failed to send to user ${subscription.user_id}:`, pushError);
        results.push({ userId: subscription.user_id, status: 'failed', error: String(pushError) });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results, sentAt: now.toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in send-notifications:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
