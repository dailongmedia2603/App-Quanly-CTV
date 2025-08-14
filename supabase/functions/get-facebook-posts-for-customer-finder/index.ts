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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch from Bao_cao_tong_hop for all Facebook-sourced posts
    const { data: reports, error: reportError } = await supabaseAdmin
      .from('"Bao_cao_tong_hop"')
      .select(`
        id, 
        campaign_id, 
        posted_at, 
        keywords_found, 
        ai_evaluation, 
        sentiment, 
        source_url, 
        scanned_at, 
        description, 
        suggested_comment,
        identified_service_id,
        service:document_services ( name )
      `)
      .eq('source_type', 'Facebook');

    if (reportError) {
      console.error("Error fetching from Bao_cao_tong_hop:", reportError);
      throw new Error(`Lỗi khi lấy báo cáo: ${reportError.message}`);
    }
    
    const allData = (reports || []).map((report: any) => ({
      ...report,
      identified_service_name: report.service?.name || null,
    }));

    // Sort by posted_at descending
    allData.sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime());

    return new Response(JSON.stringify(allData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error in get-facebook-posts-for-customer-finder:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})