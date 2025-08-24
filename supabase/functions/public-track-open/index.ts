// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

declare const Deno: any;

const PIXEL_B64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const PIXEL_DATA = atob(PIXEL_B64);

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const logId = url.searchParams.get('log_id');

    if (logId) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabaseAdmin
        .from('email_campaign_logs')
        .update({ opened_at: new Date().toISOString() })
        .eq('id', logId)
        .is('opened_at', null);
    }
  } catch (error) {
    console.error('Error tracking open:', error.message);
  }

  const pixelBuf = new Uint8Array(PIXEL_DATA.length);
  for (let i = 0; i < PIXEL_DATA.length; i++) {
    pixelBuf[i] = PIXEL_DATA.charCodeAt(i);
  }

  return new Response(pixelBuf, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
    status: 200,
  });
}, { 
  // Quan trọng: Tắt xác thực JWT cho function này
  verifyJwt: false 
});