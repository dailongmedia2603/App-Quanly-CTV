// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { apiUrl, apiKey } = await req.json()
    if (!apiUrl || !apiKey) {
      throw new Error('API URL and API Key are required.');
    }

    const testUrl = `${apiUrl.replace(/\/$/, '')}/models`;

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json' 
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorMessage = responseData.error?.message || `Connection failed with status: ${response.status}`;
      throw new Error(errorMessage);
    }

    if (!responseData.data || responseData.data.length === 0) {
        throw new Error("Connection successful, but no models were found.");
    }

    return new Response(JSON.stringify({ success: true, message: 'Kết nối thành công!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Return 200 so client can parse the error message
    })
  }
})