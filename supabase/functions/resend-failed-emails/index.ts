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
    const { campaign_id } = await req.json();
    if (!campaign_id) throw new Error("Campaign ID is required.");

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    // 1. Find failed email logs for the campaign
    const { data: failedLogs, error: fetchError } = await supabaseAdmin
      .from('email_campaign_logs')
      .select('id')
      .eq('campaign_id', campaign_id)
      .eq('status', 'failed');

    if (fetchError) throw fetchError;

    if (!failedLogs || failedLogs.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No failed emails to resend." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 2. Delete the failed logs so the scheduler can pick them up again
    const failedLogIds = failedLogs.map(log => log.id);
    const { error: deleteError } = await supabaseAdmin
      .from('email_campaign_logs')
      .delete()
      .in('id', failedLogIds);

    if (deleteError) throw deleteError;

    // 3. Reset the campaign status to 'sending' to re-activate the scheduler
    // Also reset last_sent_at to ensure the scheduler runs immediately
    const { error: updateError } = await supabaseAdmin
      .from('email_campaigns')
      .update({ status: 'sending', last_sent_at: null })
      .eq('id', campaign_id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, message: `Đã lên lịch gửi lại ${failedLogs.length} email thất bại.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in resend-failed-emails function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})