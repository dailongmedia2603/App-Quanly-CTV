// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Dữ liệu của ảnh GIF trong suốt 1x1 pixel
const PIXEL_B64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const PIXEL_DATA = atob(PIXEL_B64);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    const logId = url.searchParams.get('log_id');

    if (logId) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Chỉ cập nhật opened_at nếu nó chưa được ghi nhận, để đếm lượt mở đầu tiên
      await supabaseAdmin
        .from('email_campaign_logs')
        .update({ opened_at: new Date().toISOString() })
        .eq('id', logId)
        .is('opened_at', null);
    }
  } catch (error) {
    console.error('Lỗi khi theo dõi email mở:', error.message);
  }

  // Luôn trả về ảnh pixel để không làm hỏng client email
  const pixelBuf = new Uint8Array(PIXEL_DATA.length);
  for (let i = 0; i < PIXEL_DATA.length; i++) {
    pixelBuf[i] = PIXEL_DATA.charCodeAt(i);
  }

  return new Response(pixelBuf, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
    status: 200,
  });
})