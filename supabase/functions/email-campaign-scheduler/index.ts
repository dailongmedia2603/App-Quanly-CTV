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

  console.log("Email campaign scheduler function invoked.");

  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const now = new Date();
    console.log(`Scheduler running at: ${now.toISOString()}`);

    const { data: dueCampaigns, error: fetchError } = await supabaseAdmin
      .from('email_campaigns')
      .select('*')
      .in('status', ['scheduled', 'sending'])
      .lte('scheduled_at', now.toISOString());

    if (fetchError) {
        console.error("Error fetching due campaigns:", fetchError);
        throw fetchError;
    }

    if (!dueCampaigns || dueCampaigns.length === 0) {
      console.log("No campaigns are due to be sent at this time.");
      return new Response(JSON.stringify({ message: "No campaigns due." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    console.log(`Found ${dueCampaigns.length} campaigns to process.`);

    for (const campaign of dueCampaigns) {
      console.log(`Processing campaign: ${campaign.name} (${campaign.id}) with status: ${campaign.status}`);

      if (campaign.status === 'sending') {
        if (!campaign.last_sent_at || !campaign.send_interval_value || !campaign.send_interval_unit) {
          console.log(`Campaign ${campaign.id} is 'sending' but missing interval data. Skipping interval check.`);
        } else {
          const nextSendTime = calculateNextSendTime(new Date(campaign.last_sent_at), campaign.send_interval_value, campaign.send_interval_unit);
          console.log(`Campaign ${campaign.id}: Last sent at ${campaign.last_sent_at}, next send time is ${nextSendTime.toISOString()}`);
          if (now < nextSendTime) {
            console.log(`Skipping campaign ${campaign.id}, not time yet.`);
            continue;
          }
        }
      }

      const { data: allContacts, error: contactsError } = await supabaseAdmin.from('email_list_contacts').select('email').eq('list_id', campaign.email_list_id);
      if (contactsError) { console.error(`Error fetching contacts for campaign ${campaign.id}:`, contactsError); continue; }
      if (!allContacts) { console.log(`No contacts found for campaign ${campaign.id}.`); continue; }

      const { data: sentLogs, error: logsError } = await supabaseAdmin.from('email_campaign_logs').select('contact_email').eq('campaign_id', campaign.id);
      if (logsError) { console.error(`Error fetching logs for campaign ${campaign.id}:`, logsError); continue; }

      const sentEmails = new Set(sentLogs.map(log => log.contact_email));
      const nextContact = allContacts.find(contact => !sentEmails.has(contact.email));

      if (nextContact) {
        console.log(`Found next contact for campaign ${campaign.id}: ${nextContact.email}`);
        if (campaign.status === 'scheduled') {
          console.log(`Updating campaign ${campaign.id} status to 'sending'.`);
          await supabaseAdmin.from('email_campaigns').update({ status: 'sending' }).eq('id', campaign.id);
        }

        console.log(`Invoking send-single-email for ${nextContact.email}`);
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
          console.log(`Successfully sent email to ${nextContact.email}`);
          await supabaseAdmin.from('email_campaign_logs').insert({
            campaign_id: campaign.id, user_id: campaign.user_id, contact_email: nextContact.email,
            status: 'success', sent_at: now.toISOString(),
          });
        }
        
        console.log(`Updating last_sent_at for campaign ${campaign.id}`);
        await supabaseAdmin.from('email_campaigns').update({ last_sent_at: now.toISOString() }).eq('id', campaign.id);

      } else {
        console.log(`No more contacts to send for campaign ${campaign.id}. Marking as 'sent'.`);
        await supabaseAdmin.from('email_campaigns').update({ status: 'sent', sent_at: now.toISOString() }).eq('id', campaign.id);
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