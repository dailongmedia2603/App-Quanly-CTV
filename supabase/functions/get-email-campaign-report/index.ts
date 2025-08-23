// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LogInfo {
  status: string;
  sent_at: string | null;
  error_message: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { campaign_id } = await req.json();
    if (!campaign_id) throw new Error("Campaign ID is required.");

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('email_campaigns')
      .select('email_list_id')
      .eq('id', campaign_id)
      .single();
    if (campaignError || !campaign) throw new Error("Campaign not found.");

    const { data: contacts, error: contactsError } = await supabaseAdmin
      .from('email_list_contacts')
      .select('email')
      .eq('list_id', campaign.email_list_id);
    if (contactsError) throw contactsError;

    const { data: logs, error: logsError } = await supabaseAdmin
      .from('email_campaign_logs')
      .select('contact_email, status, sent_at, error_message')
      .eq('campaign_id', campaign_id);
    if (logsError) throw logsError;

    const logMap = new Map<string, LogInfo>(logs.map(log => [log.contact_email, { status: log.status, sent_at: log.sent_at, error_message: log.error_message }]));

    const reportContacts = contacts.map(contact => {
      const log = logMap.get(contact.email);
      return {
        email: contact.email,
        status: log ? log.status : 'pending',
        sent_at: log ? log.sent_at : null,
        error_message: log ? log.error_message : null,
      };
    });

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