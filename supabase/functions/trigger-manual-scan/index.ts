// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logScan = async (supabaseAdmin: any, campaign_id: string, status: 'info' | 'success' | 'error', message: string) => {
    if (!campaign_id) return;
    await supabaseAdmin.from('scan_logs').insert({
        campaign_id,
        status,
        message,
        log_type: 'progress',
        source_type: 'Manual Trigger'
    });
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { campaign_id } = await req.json();
    if (!campaign_id) {
      throw new Error("Cần có ID của chiến dịch.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('danh_sach_chien_dich')
      .select('type, sources, name')
      .eq('id', campaign_id)
      .single();

    if (campaignError) throw campaignError;

    await logScan(supabaseAdmin, campaign_id, 'info', `Đã nhận yêu cầu quét cho "${campaign.name}". Đang chờ xử lý...`);

    // Don't await these promises to run them in the background
    if (campaign.type === 'Facebook' || campaign.type === 'Tổng hợp') {
        const facebookSources = campaign.sources.filter((s: string) => !s.startsWith('http') && !s.startsWith('www'));
        if (facebookSources.length > 0) {
            supabaseAdmin.functions.invoke('scan-facebook-campaign', {
                body: { campaign_id: campaign_id },
            });
        }
    }
    if (campaign.type === 'Website' || campaign.type === 'Tổng hợp') {
        const websiteSources = campaign.sources.filter((s: string) => s.startsWith('http') || s.startsWith('www'));
        if (websiteSources.length > 0) {
            supabaseAdmin.functions.invoke('scan-website-campaign', {
                body: { campaign_id: campaign_id },
            });
        }
    }

    return new Response(JSON.stringify({ success: true, message: "Quá trình quét đã được bắt đầu." }), {
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