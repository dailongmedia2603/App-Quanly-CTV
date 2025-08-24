// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CampaignLog {
  contact_email: string;
  status: string;
  sent_at: string | null;
  error_message: string | null;
  email_contents: { name: string } | null;
  opened_at: string | null;
  clicked_at: string | null;
  sent_html_content: string | null;
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

    const [contactsRes, logsRes] = await Promise.all([
      supabaseAdmin.from('email_list_contacts').select('email').eq('list_id', campaign.email_list_id),
      supabaseAdmin.from('email_campaign_logs').select('*, email_contents(name)').eq('campaign_id', campaign_id)
    ]);

    if (contactsRes.error) throw contactsRes.error;
    if (logsRes.error) throw logsRes.error;

    const allContacts = contactsRes.data || [];
    const campaignLogs: CampaignLog[] = logsRes.data || [];

    const logsByEmail = new Map(campaignLogs.map(log => [log.contact_email, log]));

    const reportContacts = allContacts.map(contact => {
      const log = logsByEmail.get(contact.email);
      if (log) {
        return {
          email: contact.email,
          status: log.status,
          sent_at: log.sent_at,
          error_message: log.error_message,
          content_name: log.email_contents?.name || 'N/A',
          opened_at: log.opened_at,
          clicked_at: log.clicked_at,
          sent_html_content: log.sent_html_content,
        };
      } else {
        return {
          email: contact.email,
          status: 'pending',
          sent_at: null,
          error_message: null,
          content_name: 'Chưa gửi',
          opened_at: null,
          clicked_at: null,
          sent_html_content: null,
        };
      }
    });

    const stats = {
      total: allContacts.length,
      success: campaignLogs.filter(log => log.status === 'success').length,
      failed: campaignLogs.filter(log => log.status === 'failed').length,
      opened: campaignLogs.filter(log => log.opened_at !== null).length,
      clicked: campaignLogs.filter(log => log.clicked_at !== null).length,
    };

    return new Response(JSON.stringify({ stats, contacts: reportContacts }), {
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