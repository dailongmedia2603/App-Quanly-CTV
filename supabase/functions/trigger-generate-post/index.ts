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
    const body = await req.json();
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Missing authorization header.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Invoke the processing function without awaiting its result
    supabaseAdmin.functions.invoke('process-generate-post', {
      body,
      headers: {
        'Authorization': authHeader
      }
    });

    // Immediately return a 202 Accepted response
    return new Response(JSON.stringify({ success: true, message: "Yêu cầu tạo bài viết đã được tiếp nhận." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 202,
    });

  } catch (error) {
    console.error('Lỗi tại hàm trigger-generate-post:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})