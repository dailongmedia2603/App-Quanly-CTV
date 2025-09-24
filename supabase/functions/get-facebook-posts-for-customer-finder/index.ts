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

    // Step 1: Call the new RPC function to get unified data
    const { data: reports, error: reportError } = await supabaseAdmin
      .rpc('get_all_facebook_posts_for_finder');

    if (reportError) {
      console.error("Error calling RPC function:", reportError);
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

    // Step 3: Fetch corresponding services
    if (serviceIds.length > 0) {
        const { data: services, error: servicesError } = await supabaseAdmin
            .from('document_services')
            .select('id, name')
            .in('id', serviceIds);

        if (servicesError) {
            console.error("Error fetching services:", servicesError);
        } else {
            servicesMap = new Map(services.map(s => [s.id, s.name]));
        }
    }
    
    // Step 4: Map service names
    const allData = reports.map((report) => {
      return {
        ...report,
        identified_service_name: servicesMap.get(report.identified_service_id) || null,
      }
    });

    // Step 5: Robustly sort by posted_at descending
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