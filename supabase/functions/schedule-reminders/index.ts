import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduledEvent {
  id: string;
  member_id: string;
  title: string;
  scheduled_date: string;
  scheduled_time: string | null;
  event_type: string;
  status: string;
}

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get today's date in UTC
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    console.log(`Checking scheduled events for ${todayStr}`);

    // Fetch today's scheduled events that haven't been completed
    const { data: events, error: eventsError } = await supabase
      .from('scheduled_events')
      .select('id, member_id, title, scheduled_date, scheduled_time, event_type, status')
      .eq('scheduled_date', todayStr)
      .eq('status', 'scheduled');

    if (eventsError) {
      throw new Error(`Failed to fetch events: ${eventsError.message}`);
    }

    if (!events || events.length === 0) {
      console.log('No scheduled events for today');
      return new Response(
        JSON.stringify({ success: true, message: 'No events to notify', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${events.length} events to process`);

    // Get unique member IDs
    const memberIds = [...new Set(events.map(e => e.member_id))];

    // Fetch member profiles to get user_ids
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_id, display_name')
      .in('id', memberIds);

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Group events by member
    const eventsByMember = events.reduce((acc, event) => {
      if (!acc[event.member_id]) {
        acc[event.member_id] = [];
      }
      acc[event.member_id].push(event);
      return acc;
    }, {} as Record<string, ScheduledEvent[]>);

    let notificationsSent = 0;

    // Send notifications for each member
    for (const memberId of Object.keys(eventsByMember)) {
      const memberEvents = eventsByMember[memberId];
      const profile = profileMap.get(memberId);
      if (!profile?.user_id) continue;

      // Get push subscriptions for this user
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', profile.user_id);

      if (!subscriptions || subscriptions.length === 0) {
        console.log(`No push subscriptions for user ${profile.user_id}`);
        continue;
      }

      // Create notification message
      const eventCount = memberEvents.length;
      const firstEvent = memberEvents[0];
      
      let title = '📅 Geplande activiteit vandaag';
      let body = '';

      if (eventCount === 1) {
        const timeStr = firstEvent.scheduled_time ? ` om ${firstEvent.scheduled_time.slice(0, 5)}` : '';
        body = `${firstEvent.title}${timeStr}`;
      } else {
        body = `Je hebt ${eventCount} activiteiten gepland voor vandaag`;
      }

      // Log notification (in production, send via web-push)
      console.log(`Would send notification to ${profile.display_name || 'User'}:`, { title, body });

      // For each subscription, we would send the notification
      // In production, use web-push library with VAPID keys
      for (const sub of subscriptions) {
        try {
          const subscription = JSON.parse(sub.subscription as string);
          
          // Note: Actual web-push implementation would go here
          // For now, we're logging the notification
          console.log('Notification payload:', {
            subscription: subscription.endpoint,
            title,
            body,
            data: {
              url: '/dashboard',
              events: memberEvents.map((e: ScheduledEvent) => e.id),
            },
          });

          notificationsSent++;
        } catch (parseError) {
          console.error('Error parsing subscription:', parseError);
        }
      }
    }

    console.log(`Processed ${notificationsSent} notifications`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        eventsFound: events.length,
        notificationsSent 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in schedule-reminders:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
