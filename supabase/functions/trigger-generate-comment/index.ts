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
    const { reportId, postContent } = await req.json();
    if (!reportId || !postContent) {
      throw new Error("Yêu cầu ID báo cáo và nội dung bài đăng.");
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Missing authorization header.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Invoke the processing function without awaiting its result
    supabaseAdmin.functions.invoke('process-customer-finder-comment', {
      body: { reportId, postContent },
      headers: {
        'Authorization': authHeader
      }
    });

    // Immediately return a 202 Accepted response to the client
    return new Response(JSON.stringify({ success: true, message: "Yêu cầu tạo comment đã được tiếp nhận và đang được xử lý." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 202, // Accepted
    });

  } catch (error) {
    console.error('Lỗi tại hàm trigger:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})