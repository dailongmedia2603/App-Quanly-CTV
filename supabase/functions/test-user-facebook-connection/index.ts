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

    const testUrl = `${settings.user_facebook_api_url}?access_token=${settings.user_facebook_api_key}`;

    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account: {
          cookie: cookie,
          ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:141.0) Gecko/20100101 Firefox/141.0"
        },
        proxy: {
          host: "",
          port: "",
          username: "",
          password: ""
        },
        action: {
          name: "get_me"
        }
      }),
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      const errorMessage = `Máy chủ API trả về phản hồi không hợp lệ (HTTP Status: ${response.status}). Phản hồi là: "${responseText.substring(0, 200)}..."`;
      return new Response(JSON.stringify({ success: false, message: errorMessage }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (!response.ok || responseData.status?.code !== 1) {
      throw new Error(responseData.status?.message || responseData.message || `API Error: ${response.status}`);
    }

    return new Response(JSON.stringify({ success: true, message: 'Kết nối thành công!', data: responseData.data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // Cung cấp thông báo lỗi hữu ích hơn cho các lỗi mạng
    const errorMessage = `Đã xảy ra lỗi mạng khi kết nối đến API. Vui lòng kiểm tra lại API URL và đảm bảo rằng máy chủ có thể truy cập được và không bị tường lửa chặn. Lỗi này cũng có thể xảy ra nếu cookie không hợp lệ. (Chi tiết: ${error.message})`;
    return new Response(JSON.stringify({ success: false, message: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Return 200 so client can parse the error
    })
  }
})