// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { campaign_id, scheduled_at, send_interval_value, send_interval_unit } = await req.json();
    if (!campaign_id || !scheduled_at || !send_interval_value || !send_interval_unit) {
      throw new Error("Thiếu thông tin cần thiết để lên lịch.");
    }

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    const { error } = await supabaseAdmin
      .from('email_campaigns')
      .update({
        status: 'scheduled',
        scheduled_at,
        send_interval_value,
        send_interval_unit,
      })
      .eq('id', campaign_id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, message: "Chiến dịch đã được lên lịch thành công." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in schedule-email-campaign function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})