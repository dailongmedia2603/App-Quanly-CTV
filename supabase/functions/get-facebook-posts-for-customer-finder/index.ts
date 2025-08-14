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

    // Step 1: Fetch reports from Bao_cao_tong_hop
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
        identified_service_id
      `)
      .eq('source_type', 'Facebook');

    if (reportError) {
      console.error("Error fetching from Bao_cao_tong_hop:", reportError);
      throw new Error(`Lỗi khi lấy báo cáo: ${reportError.message}`);
    }

    if (!reports || reports.length === 0) {
        return new Response(JSON.stringify([]), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    // Step 2: Collect unique service IDs
    const serviceIds = [...new Set(reports.map(r => r.identified_service_id).filter(Boolean))];

    let servicesMap = new Map();

    // Step 3: Fetch corresponding services if there are any service IDs
    if (serviceIds.length > 0) {
        const { data: services, error: servicesError } = await supabaseAdmin
            .from('document_services')
            .select('id, name')
            .in('id', serviceIds);

        if (servicesError) {
            console.error("Error fetching services:", servicesError);
            // We can continue without service names, it's not a fatal error
        } else {
            servicesMap = new Map(services.map(s => [s.id, s.name]));
        }
    }
    
    // Step 4: Map service names back to reports
    const allData = reports.map((report) => ({
      ...report,
      identified_service_name: servicesMap.get(report.identified_service_id) || null,
    }));

    // Sort by posted_at descending, handling null dates gracefully
    allData.sort((a, b) => {
        const dateA = a.posted_at ? new Date(a.posted_at).getTime() : 0;
        const dateB = b.posted_at ? new Date(b.posted_at).getTime() : 0;
        return dateB - dateA;
    });

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