// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const testSingleKey = async (apiKey: string, model: string) => {
  if (!apiKey || !model) {
    return { success: false, message: 'Cần có API key và model.' };
  }

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hello" }] }],
      }),
    });

    const responseData = await response.json();

    if (response.ok) {
      return { success: true, message: 'Kết nối thành công!' };
    } else {
      const errorMessage = responseData.error?.message 
        ? `Lỗi từ Google: ${responseData.error.message}`
        : `Kết nối thất bại (HTTP ${response.status}). Vui lòng kiểm tra API key và model.`;
      return { success: false, message: errorMessage };
    }
  } catch (error) {
    return { success: false, message: `Lỗi mạng: ${error.message}` };
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { apiKeys, model } = await req.json();
    if (!apiKeys || !Array.isArray(apiKeys) || apiKeys.length === 0) {
      throw new Error("Cần có một danh sách API key.");
    }
    if (!model) {
      throw new Error("Cần có model.");
    }

    // Send requests sequentially instead of in parallel to avoid rate limiting
    const results = [];
    for (const key of apiKeys) {
      const result = await testSingleKey(key, model);
      results.push(result);
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})