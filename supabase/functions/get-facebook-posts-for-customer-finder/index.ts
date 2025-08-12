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
    const { campaign_ids } = await req.json();
    if (!campaign_ids || !Array.isArray(campaign_ids) || campaign_ids.length === 0) {
      // Return empty array if no campaigns are selected, not an error
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch from Bao_cao_Facebook
    const { data: facebookReports, error: facebookError } = await supabaseAdmin
      .from('Bao_cao_Facebook')
      .select('id, campaign_id, posted_at, keywords_found, ai_evaluation, sentiment, source_url, scanned_at, description:content')
      .in('campaign_id', campaign_ids);

    if (facebookError) {
      console.error("Error fetching from Bao_cao_Facebook:", facebookError);
      throw new Error(`Lỗi khi lấy báo cáo Facebook: ${facebookError.message}`);
    }

    // Fetch from Bao_cao_tong_hop for Facebook source type
    const { data: combinedReports, error: combinedError } = await supabaseAdmin
      .from('Bao_cao_tong_hop')
      .select('*')
      .in('campaign_id', campaign_ids)
      .eq('source_type', 'Facebook');

    if (combinedError) {
      console.error("Error fetching from Bao_cao_tong_hop:", combinedError);
      throw new Error(`Lỗi khi lấy báo cáo tổng hợp: ${combinedError.message}`);
    }
    
    // Combine results
    const allData = [...(facebookReports || []), ...(combinedReports || [])];

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