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

    // 1. Get the email list ID from the campaign
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('email_campaigns')
      .select('email_list_id')
      .eq('id', campaign_id)
      .single();
    if (campaignError || !campaign) throw new Error("Campaign not found.");

    // 2. Get all contacts for that list
    const { data: contacts, error: contactsError } = await supabaseAdmin
      .from('email_list_contacts')
      .select('email')
      .eq('list_id', campaign.email_list_id);
    if (contactsError) throw contactsError;

    // 3. Get all logs for this campaign
    const { data: logs, error: logsError } = await supabaseAdmin
      .from('email_campaign_logs')
      .select('contact_email, status')
      .eq('campaign_id', campaign_id);
    if (logsError) throw logsError;

    const logMap = new Map(logs.map(log => [log.contact_email, log.status]));

    // 4. Combine data to create the final report
    const reportContacts = contacts.map(contact => ({
      email: contact.email,
      status: logMap.get(contact.email) || 'pending', // 'pending' means not yet sent
    }));

    // 5. Calculate stats
    const total = contacts.length;
    const success = logs.filter(log => log.status === 'success').length;
    const failed = logs.filter(log => log.status === 'failed').length;

    const report = {
      stats: { total, success, failed },
      contacts: reportContacts,
    };

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in get-email-campaign-report:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})