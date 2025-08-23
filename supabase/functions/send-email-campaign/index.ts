// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper to get a new access token from Google using a refresh token
async function getAccessToken(refreshToken: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: Deno.env.get('GOOGLE_CLIENT_ID'),
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET'),
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Google Token Error:', data);
    throw new Error('Could not refresh Google access token. Please reconnect your Gmail account.');
  }
  return data.access_token;
}

// Basic Markdown to HTML converter
function markdownToHtml(markdown: string): string {
  return markdown
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
    .replace(/\*(.*?)\*/g, '<em>$1</em>')     // Italic
    .replace(/\n/g, '<br>');                  // New lines
}

// Helper to send an email using Gmail API
async function sendEmail(accessToken: string, from: string, to: string, subject: string, body: string) {
  const htmlBody = markdownToHtml(body);
  
  const emailMessage = [
    `From: <${from}>`,
    `To: <${to}>`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`, // Encode subject for UTF-8
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    htmlBody,
  ].join('\n');

  // Gmail API requires the email to be base64url encoded
  const base64EncodedEmail = btoa(unescape(encodeURIComponent(emailMessage)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: base64EncodedEmail,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error(`Failed to send email to ${to}:`, data);
    throw new Error(`Failed to send email to ${to}. Gmail API error: ${data.error?.message || 'Unknown error'}`);
  }
  return data;
}


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { campaign_id } = await req.json();
    if (!campaign_id) throw new Error("Campaign ID is required.");

    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    // 1. Fetch user's refresh token
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('google_refresh_token, google_connected_email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.google_refresh_token || !profile?.google_connected_email) {
      throw new Error("Tài khoản Gmail chưa được kết nối hoặc đã hết hạn. Vui lòng kết nối lại.");
    }

    // 2. Fetch campaign details, contacts, and content
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('email_campaigns')
      .select('*, email_lists(email_list_contacts(email)), email_contents(subject, body)')
      .eq('id', campaign_id)
      .single();

    if (campaignError || !campaign) throw new Error("Không tìm thấy chiến dịch.");
    if (campaign.status !== 'draft') throw new Error("Chiến dịch này đã được gửi hoặc đang xử lý.");

    const contacts = campaign.email_lists?.email_list_contacts;
    const content = campaign.email_contents;

    if (!contacts || contacts.length === 0) throw new Error("Danh sách email không có liên hệ nào.");
    if (!content || !content.subject || !content.body) throw new Error("Nội dung email không hợp lệ.");

    // 3. Get a fresh access token
    const accessToken = await getAccessToken(profile.google_refresh_token);

    // 4. Send emails
    let successCount = 0;
    let errorCount = 0;
    for (const contact of contacts) {
      try {
        await sendEmail(accessToken, profile.google_connected_email, contact.email, content.subject, content.body);
        successCount++;
      } catch (e) {
        console.error(e);
        errorCount++;
      }
    }

    // 5. Update campaign status
    await supabaseAdmin
      .from('email_campaigns')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', campaign_id);

    const message = `Gửi chiến dịch hoàn tất. ${successCount} email thành công, ${errorCount} email thất bại.`;

    return new Response(JSON.stringify({ success: true, message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in send-email-campaign function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})