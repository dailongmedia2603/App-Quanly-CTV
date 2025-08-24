// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const getAccessToken = async (refreshToken: string) => {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: Deno.env.get('GOOGLE_CLIENT_ID'),
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET'),
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    if (data.error === 'invalid_grant') {
      throw new Error("Kết nối Google đã hết hạn hoặc không hợp lệ. Vui lòng kết nối lại tài khoản Gmail của bạn.");
    }
    throw new Error(`Failed to refresh token: ${data.error_description || 'Unknown error'}`);
  }
  return data.access_token;
};

const cleanHtmlBodyForSending = (html: string | null): string => {
  if (!html) return '';
  let cleanedHtml = html.trim();
  cleanedHtml = cleanedHtml.replace(/^```(html)?\s*\n/i, '').replace(/\n\s*```$/, '');
  return cleanedHtml;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const { campaign, contact, sent_count, log_id } = await req.json();
  const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

  try {
    if (!campaign || !contact || sent_count === undefined || !log_id) {
      throw new Error("Campaign, contact info, sent_count, and log_id are required.");
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('google_refresh_token, google_connected_email')
      .eq('id', campaign.user_id)
      .single();

    if (profileError || !profile?.google_refresh_token) {
      throw new Error("Người dùng chưa kết nối tài khoản Gmail hoặc token đã bị mất.");
    }

    const accessToken = await getAccessToken(profile.google_refresh_token);

    if (!campaign.email_content_ids || campaign.email_content_ids.length === 0) {
      throw new Error("Chiến dịch không có nội dung email nào được chọn.");
    }

    const contentIndex = sent_count % campaign.email_content_ids.length;
    const contentId = campaign.email_content_ids[contentIndex];

    const { data: emailContent, error: contentError } = await supabaseAdmin
      .from('email_contents')
      .select('subject, body')
      .eq('id', contentId)
      .single();
    if (contentError || !emailContent) throw new Error(`Không tìm thấy nội dung email với ID: ${contentId}`);

    const fromEmail = profile.google_connected_email || 'me';
    
    const encodedSubject = btoa(unescape(encodeURIComponent(emailContent.subject)));
    
    let emailBody = cleanHtmlBodyForSending(emailContent.body);

    // 1. Inject Click Tracking
    const trackingClickUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/track-email-click`;
    emailBody = emailBody.replace(/href="([^"]+)"/g, (match, originalUrl) => {
      if (originalUrl.startsWith('http')) { // Only track absolute URLs
        const encodedUrl = encodeURIComponent(originalUrl);
        return `href="${trackingClickUrl}?log_id=${log_id}&redirect_url=${encodedUrl}"`;
      }
      return match; // Don't modify non-http links (e.g., mailto:)
    });

    // 2. Inject Open Tracking Pixel
    const trackingOpenUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/track-email-open?log_id=${log_id}`;
    const trackingPixel = `<img src="${trackingOpenUrl}" width="1" height="1" alt="" style="display:none;"/>`;
    if (emailBody.includes('</body>')) {
      emailBody = emailBody.replace('</body>', `${trackingPixel}</body>`);
    } else {
      emailBody += trackingPixel;
    }

    const emailMessage = [
      `Content-Type: text/html; charset="UTF-8"`,
      `MIME-Version: 1.0`,
      `to: ${contact.email}`,
      `from: ${fromEmail}`,
      `subject: =?utf-8?B?${encodedSubject}?=`,
      ``,
      `${emailBody}`
    ].join('\n');

    const base64EncodedEmail = btoa(unescape(encodeURIComponent(emailMessage))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: base64EncodedEmail }),
    });

    const sendResult = await sendResponse.json();

    if (!sendResponse.ok) {
      throw new Error(`Gmail API error: ${sendResult.error?.message || 'Failed to send email'}`);
    }

    // Update log to success
    await supabaseAdmin.from('email_campaign_logs').update({
      status: 'success',
      sent_at: new Date().toISOString()
    }).eq('id', log_id);

    return new Response(JSON.stringify({ success: true, messageId: sendResult.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in send-single-email function:', error);
    // Update log to failed
    await supabaseAdmin.from('email_campaign_logs').update({
      status: 'failed',
      error_message: error.message,
      sent_at: new Date().toISOString()
    }).eq('id', log_id);

    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, 
    })
  }
})