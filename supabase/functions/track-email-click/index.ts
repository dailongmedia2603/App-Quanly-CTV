// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const updateLog = async (logId: string) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Chỉ cập nhật clicked_at nếu nó chưa được ghi nhận, để đếm lượt click đầu tiên
    const { error } = await supabaseAdmin
      .from('email_campaign_logs')
      .update({ clicked_at: new Date().toISOString() })
      .eq('id', logId)
      .is('clicked_at', null);
    
    if (error) {
      console.error(`Lỗi CSDL khi theo dõi click mail cho log ID ${logId}:`, error);
    }
  } catch (e) {
    console.error('Lỗi không mong muốn khi theo dõi click mail:', e.message);
  }
};

serve((req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const url = new URL(req.url);
  const logId = url.searchParams.get('log_id');
  const redirectUrl = url.searchParams.get('redirect_url');

  if (!redirectUrl) {
    return new Response(JSON.stringify({ error: 'Redirect URL is required.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }

  if (logId) {
    // Không await, thực hiện cập nhật trong nền
    updateLog(logId);
  }

  // Luôn chuyển hướng người dùng đến link đích ngay lập tức
  return Response.redirect(redirectUrl, 302);
})