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
    const now = new Date();

    // First, update the campaign with the scheduling info
    const { data: campaign, error: updateError } = await supabaseAdmin
      .from('email_campaigns')
      .update({
        status: 'scheduled',
        scheduled_at,
        send_interval_value,
        send_interval_unit,
      })
      .eq('id', campaign_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // If the campaign is scheduled to start now or in the past, trigger the first email immediately
    if (new Date(scheduled_at) <= now) {
      // Find the first contact to email
      const { data: allContacts, error: contactsError } = await supabaseAdmin.from('email_list_contacts').select('email').eq('list_id', campaign.email_list_id);
      if (contactsError) throw contactsError;

      if (allContacts && allContacts.length > 0) {
        const firstContact = allContacts[0];

        // Change status to 'sending'
        await supabaseAdmin.from('email_campaigns').update({ status: 'sending' }).eq('id', campaign.id);

        // Invoke the function to send the single email
        const { data: sendResult, error: sendError } = await supabaseAdmin.functions.invoke('send-single-email', {
          body: { campaign, contact: firstContact }
        });

        if (sendError || (sendResult && !sendResult.success)) {
          const errorMessage = sendError?.message || sendResult?.error || "Unknown error during sending.";
          await supabaseAdmin.from('email_campaign_logs').insert({
            campaign_id: campaign.id, user_id: campaign.user_id, contact_email: firstContact.email,
            status: 'failed', error_message: errorMessage, sent_at: now.toISOString(),
          });
        } else {
          await supabaseAdmin.from('email_campaign_logs').insert({
            campaign_id: campaign.id, user_id: campaign.user_id, contact_email: firstContact.email,
            status: 'success', sent_at: now.toISOString(),
          });
        }
        
        // Update the last_sent_at timestamp
        await supabaseAdmin.from('email_campaigns').update({ last_sent_at: now.toISOString() }).eq('id', campaign.id);

      } else {
        // No contacts, mark as sent
        await supabaseAdmin.from('email_campaigns').update({ status: 'sent' }).eq('id', campaign.id);
      }
    }

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