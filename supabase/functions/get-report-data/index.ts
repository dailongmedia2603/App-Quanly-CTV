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
    const { campaign_id, campaign_type } = await req.json();
    if (!campaign_id || !campaign_type) {
      throw new Error("Cần có ID và loại của chiến dịch.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let tableName = '';
    let selectStatement = '*';

    if (campaign_type === 'Facebook') {
      tableName = 'Bao_cao_Facebook';
      // Alias content to description to create a consistent field for the frontend
      selectStatement = 'id, campaign_id, posted_at, keywords_found, ai_evaluation, sentiment, source_url, scanned_at, description:content';
    } else {
      return new Response(JSON.stringify({ error: "Loại chiến dịch không hợp lệ" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { data, error } = await supabaseAdmin
      .from(tableName)
      .select(selectStatement)
      .eq('campaign_id', campaign_id)
      .order('posted_at', { ascending: false });

    if (error) {
      throw new Error(`Lấy dữ liệu báo cáo thất bại: ${error.message}`);
    }

    return new Response(JSON.stringify(data), {
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