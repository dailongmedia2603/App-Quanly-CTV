// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const calculateNextSendTime = (lastSent: Date, interval: number, unit: string): Date => {
    const nextTime = new Date(lastSent.getTime());
    switch (unit) {
        case 'minute': nextTime.setMinutes(nextTime.getMinutes() + interval); break;
        case 'hour': nextTime.setHours(nextTime.getHours() + interval); break;
        case 'day': nextTime.setDate(nextTime.getDate() + interval); break;
        default: nextTime.setMinutes(nextTime.getMinutes() + interval); break;
    }
    return nextTime;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const now = new Date();

    const { data: dueCampaigns, error: fetchError } = await supabaseAdmin
      .from('email_campaigns')
      .select('*')
      .in('status', ['scheduled', 'sending'])
      .lte('scheduled_at', now.toISOString());

    if (fetchError) throw fetchError;
    if (!dueCampaigns || dueCampaigns.length === 0) {
      return new Response(JSON.stringify({ message: "No campaigns due." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    for (const campaign of dueCampaigns) {
      if (campaign.status === 'sending' && campaign.last_sent_at) {
        const nextSendTime = calculateNextSendTime(new Date(campaign.last_sent_at), campaign.send_interval_value, campaign.send_interval_unit);
        if (now < nextSendTime) {
          continue;
        }
      }

      const { data: allContacts, error: contactsError } = await supabaseAdmin.from('email_list_contacts').select('email').eq('list_id', campaign.email_list_id);
      if (contactsError) { console.error(`Error fetching contacts for campaign ${campaign.id}:`, contactsError); continue; }

      const { data: sentLogs, error: logsError } = await supabaseAdmin.from('email_campaign_logs').select('contact_email').eq('campaign_id', campaign.id);
      if (logsError) { console.error(`Error fetching logs for campaign ${campaign.id}:`, logsError); continue; }

      const sentEmails = new Set(sentLogs.map(log => log.contact_email));
      const nextContact = allContacts.find(contact => !sentEmails.has(contact.email));

      if (nextContact) {
        if (campaign.status === 'scheduled') {
          await supabaseAdmin.from('email_campaigns').update({ status: 'sending' }).eq('id', campaign.id);
        }

        const { data: sendResult, error: sendError } = await supabaseAdmin.functions.invoke('send-single-email', {
          body: { campaign, contact: nextContact }
        });

        if (sendError || (sendResult && !sendResult.success)) {
          const errorMessage = sendError?.message || sendResult?.error || "Unknown error during sending.";
          console.error(`Failed to send email to ${nextContact.email} for campaign ${campaign.id}:`, errorMessage);
          await supabaseAdmin.from('email_campaign_logs').insert({
            campaign_id: campaign.id, user_id: campaign.user_id, contact_email: nextContact.email,
            status: 'failed', error_message: errorMessage, sent_at: now.toISOString(),
          });
        } else {
          await supabaseAdmin.from('email_campaign_logs').insert({
            campaign_id: campaign.id, user_id: campaign.user_id, contact_email: nextContact.email,
            status: 'success', sent_at: now.toISOString(),
          });
        }
        
        await supabaseAdmin.from('email_campaigns').update({ last_sent_at: now.toISOString() }).eq('id', campaign.id);

      } else {
        await supabaseAdmin.from('email_campaigns').update({ status: 'sent' }).eq('id', campaign.id);
      }
    }

    return new Response(JSON.stringify({ success: true, message: `Processed ${dueCampaigns.length} campaigns.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in email-campaign-scheduler:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})