// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { sender_id, receiver_id, is_in_gauntlet } = await req.json();

    if (!sender_id || !receiver_id) {
      return new Response(JSON.stringify({ error: 'Missing parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare the nudge payload
    let title = "Rival Nudge";
    let body = "Your Rival is pushing ahead. Stay in the fight.";

    if (is_in_gauntlet) {
      title = "CRITICAL: GAUNTLET PROTOCOL";
      body = "Your Rival is watching. Don't break the Cadence.";
    }

    // In a real scenario, fetch the Expo Push Token for the receiver_id from a "user_devices" table.
    // For now, we simulate the Expo Push API call.
    const { data: userData } = await supabase
      .from('users')
      .select('expo_push_token')
      .eq('user_id', receiver_id)
      .single();

    if (userData?.expo_push_token) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: userData.expo_push_token,
          title,
          body,
          data: { type: 'RIVAL_NUDGE', sender_id },
        }),
      });
    }

    // Alternatively, just inject a row into a 'notifications' table to sync realtime toast.
    // We'll trust the caller that it was sent successfully via Realtime.
    
    return new Response(JSON.stringify({ success: true, message: 'Nudge deployed.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
