// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to get a new access token from a refresh token
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { campaign, contact } = await req.json();
    if (!campaign || !contact) throw new Error("Campaign and contact info are required.");

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('google_refresh_token, google_connected_email')
      .eq('id', campaign.user_id)
      .single();

    if (profileError || !profile?.google_refresh_token) {
      throw new Error("Người dùng chưa kết nối tài khoản Gmail hoặc token đã bị mất.");
    }

    const accessToken = await getAccessToken(profile.google_refresh_token);

    const { data: emailContent, error: contentError } = await supabaseAdmin
      .from('email_contents')
      .select('subject, body')
      .eq('id', campaign.email_content_id)
      .single();
    if (contentError || !emailContent) throw new Error("Email content not found.");

    const fromEmail = profile.google_connected_email || 'me';
    
    // **FIX:** Correctly handle UTF-8 characters in the subject
    const encodedSubject = btoa(unescape(encodeURIComponent(emailContent.subject)));

    const emailMessage = [
      `Content-Type: text/html; charset="UTF-8"`,
      `MIME-Version: 1.0`,
      `to: ${contact.email}`,
      `from: ${fromEmail}`,
      `subject: =?utf-8?B?${encodedSubject}?=`,
      ``,
      `${emailContent.body}`
    ].join('\n');

    // **FIX:** Correctly handle UTF-8 characters in the entire email body before encoding
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

    return new Response(JSON.stringify({ success: true, messageId: sendResult.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in send-single-email function:', error);
    // This is the key change: return a 200 OK status but with a success: false payload
    // This prevents the calling function from crashing.
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, 
    })
  }
})