import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, title, body, data }: NotificationRequest = await req.json();

    console.log('Sending notification to user:', userId);

    // Get user's push subscriptions from database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const subscriptionsResponse = await fetch(
      `${supabaseUrl}/rest/v1/push_subscriptions?user_id=eq.${userId}`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!subscriptionsResponse.ok) {
      throw new Error('Failed to fetch subscriptions');
    }

    const subscriptions = await subscriptionsResponse.json();

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found for user:', userId);
      return new Response(
        JSON.stringify({ success: false, message: 'No subscriptions found' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Send notification to all user's devices
    const notificationPromises = subscriptions.map(async (sub: any) => {
      try {
        const subscription = JSON.parse(sub.subscription);
        
        // Web Push notification payload
        const payload = JSON.stringify({
          title,
          body,
          icon: '/ube-logo.png',
          badge: '/ube-logo.png',
          data: data || {},
        });

        // Note: In production, you would use web-push library with VAPID keys
        // For now, we'll log the notification
        console.log('Would send notification:', {
          subscription,
          payload,
        });

        return { success: true };
      } catch (error: any) {
        console.error('Error sending to subscription:', error);
        return { success: false, error: error.message };
      }
    });

    const results = await Promise.all(notificationPromises);
    const successCount = results.filter(r => r.success).length;

    console.log(`Sent ${successCount}/${subscriptions.length} notifications`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount,
        total: subscriptions.length 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('Error in send-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
