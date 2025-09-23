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
    const { cookie } = await req.json();
    if (!cookie) {
      throw new Error("Cookie is required.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('app_settings')
      .select('user_facebook_api_url, user_facebook_api_key')
      .eq('id', 1)
      .single();

    if (settingsError || !settings || !settings.user_facebook_api_url || !settings.user_facebook_api_key) {
      throw new Error("User Facebook API is not configured in settings.");
    }

    // Assuming a /me endpoint exists for testing the connection
    const response = await fetch(`${settings.user_facebook_api_url}/me`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': settings.user_facebook_api_key,
      },
      body: JSON.stringify({ cookie }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || `API Error: ${response.status}`);
    }

    return new Response(JSON.stringify({ success: true, message: 'Kết nối thành công!', data: responseData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Return 200 so client can parse the error
    })
  }
})