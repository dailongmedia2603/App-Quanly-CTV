// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper to add a delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { campaign_id } = await req.json();
    if (!campaign_id) throw new Error("Campaign ID is required.");

    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } });
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) throw new Error("User session not found or invalid.");
    
    const accessToken = session.provider_token;
    if (!accessToken) throw new Error("Google access token not found in session. Please reconnect your Gmail account.");

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    const { data: campaign, error: campaignError } = await supabaseAdmin.from('email_campaigns').select('*, email_contents(*), email_lists(*)').eq('id', campaign_id).single();
    if (campaignError || !campaign) throw new Error("Campaign not found.");

    const { data: contacts, error: contactsError } = await supabaseAdmin.from('email_list_contacts').select('email').eq('list_id', campaign.email_list_id);
    if (contactsError || !contacts) throw new Error("Could not fetch contacts for the list.");

    await supabaseAdmin.from('email_campaigns').update({ status: 'sending', scheduled_at: new Date().toISOString() }).eq('id', campaign.id);

    let successCount = 0;
    let failCount = 0;

    for (const contact of contacts) {
      const emailMessage = [
        `Content-Type: text/html; charset="UTF-8"`,
        `MIME-Version: 1.0`,
        `to: ${contact.email}`,
        `from: ${session.user.email}`,
        `subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(campaign.email_contents.subject)))}?=`,
        ``,
        `${campaign.email_contents.body}`
      ].join('\n');

      const base64EncodedEmail = btoa(emailMessage).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      try {
        const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw: base64EncodedEmail }),
        });

        const sendResult = await sendResponse.json();
        if (!sendResponse.ok) throw new Error(sendResult.error?.message || 'Failed to send email');
        
        await supabaseAdmin.from('email_campaign_logs').insert({ campaign_id, user_id: session.user.id, contact_email: contact.email, status: 'success', sent_at: new Date().toISOString() });
        successCount++;
      } catch (e) {
        await supabaseAdmin.from('email_campaign_logs').insert({ campaign_id, user_id: session.user.id, contact_email: contact.email, status: 'failed', error_message: e.message, sent_at: new Date().toISOString() });
        failCount++;
      }
      await delay(2000); // Wait 2 seconds between emails to avoid rate limits
    }

    await supabaseAdmin.from('email_campaigns').update({ status: 'sent' }).eq('id', campaign.id);

    return new Response(JSON.stringify({ success: true, message: `Gửi hoàn tất. Thành công: ${successCount}, Thất bại: ${failCount}.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in send-campaign-directly function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})