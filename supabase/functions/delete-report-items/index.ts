// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { item_ids, campaign_type } = await req.json();
    if (!item_ids || !Array.isArray(item_ids) || item_ids.length === 0) {
      throw new Error("Cần có danh sách ID các mục cần xóa.");
    }
    if (!campaign_type) {
      throw new Error("Cần có loại của chiến dịch.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let tableName = '';
    if (campaign_type === 'Facebook') {
      tableName = 'Bao_cao_Facebook';
    } else {
      return new Response(JSON.stringify({ error: "Loại chiến dịch không hợp lệ" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { error } = await supabaseAdmin
      .from(tableName)
      .delete()
      .in('id', item_ids);

    if (error) {
      throw new Error(`Xóa dữ liệu báo cáo thất bại: ${error.message}`);
    }

    return new Response(JSON.stringify({ success: true, message: `Đã xóa ${item_ids.length} mục.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})