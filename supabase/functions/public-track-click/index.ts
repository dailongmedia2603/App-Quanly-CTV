// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

declare const Deno: any;

serve(async (req) => {
  const url = new URL(req.url);
  const logId = url.searchParams.get('log_id');
  const redirectUrl = url.searchParams.get('redirect_url');

  if (!redirectUrl) {
    return new Response("Redirect URL is required.", { status: 400 });
  }

  try {
    if (logId) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabaseAdmin
        .from('email_campaign_logs')
        .update({ clicked_at: new Date().toISOString() })
        .eq('id', logId)
        .is('clicked_at', null);
    }
  } catch (error) {
    console.error('Error tracking click:', error.message);
  }

  return new Response(null, {
    status: 302,
    headers: {
      'Location': redirectUrl,
    },
  });
}, { 
  // Quan trọng: Tắt xác thực JWT cho function này
  verifyJwt: false 
});