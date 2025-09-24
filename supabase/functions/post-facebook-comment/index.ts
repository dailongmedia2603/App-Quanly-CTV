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

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let user_id_for_log: string | null = null;
  let api_url_for_log: string | null = null;
  let request_body_for_log: any = null;

  try {
    const { postId, commentText, userId } = await req.json(); // Allow optional userId for automated calls
    if (!postId || !commentText) {
      throw new Error("Post ID and comment text are required.");
    }

    let targetUserId = userId;

    if (!targetUserId) {
      const authHeader = req.headers.get('Authorization')!;
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated.");
      targetUserId = user.id;
    }
    
    user_id_for_log = targetUserId;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('facebook_cookie')
      .eq('id', targetUserId)
      .single();

    if (profileError || !profile || !profile.facebook_cookie) {
      throw new Error(`Facebook cookie not found for user ${targetUserId}. Please set it in the profile.`);
    }

    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('app_settings')
      .select('user_facebook_api_url, user_facebook_api_key, user_facebook_api_proxies')
      .eq('id', 1)
      .single();

    if (settingsError || !settings || !settings.user_facebook_api_url || !settings.user_facebook_api_key) {
      throw new Error("User Facebook API is not configured in settings.");
    }

    // --- START ROBUST PROXY LOGIC ---
    let proxy = { host: "", port: "", username: "", password: "" };
    const proxies = settings.user_facebook_api_proxies as any[];

    if (proxies && Array.isArray(proxies) && proxies.length > 0) {
      const proxy_count = proxies.length;

      const { data: usageData, error: usageError } = await supabaseAdmin
        .from('api_key_usage')
        .select('last_used_index')
        .eq('service', 'user_facebook_proxy')
        .single();

      let last_index = -1;
      if (usageError && usageError.code !== 'PGRST116') {
        console.error("Error fetching proxy usage:", usageError.message);
      } else if (usageData) {
        last_index = usageData.last_used_index ?? -1;
      }

      const next_index = (last_index + 1) % proxy_count;

      const { error: updateUsageError } = await supabaseAdmin
        .from('api_key_usage')
        .upsert({ service: 'user_facebook_proxy', last_used_index: next_index }, { onConflict: 'service' });

      if (updateUsageError) {
        console.error("Error updating proxy usage:", updateUsageError.message);
      }

      const nextProxyData = proxies[next_index];
      if (nextProxyData) {
        proxy = {
          host: nextProxyData.host || "",
          port: nextProxyData.port || "",
          username: nextProxyData.username || "",
          password: nextProxyData.password || ""
        };
      }
    }
    // --- END ROBUST PROXY LOGIC ---

    const apiUrl = `${settings.user_facebook_api_url.replace(/\/$/, '')}/services/fbql?access_token=${settings.user_facebook_api_key}`;
    api_url_for_log = apiUrl;

    const requestPayload = {
      account: {
        cookie: profile.facebook_cookie,
        ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:141.0) Gecko/20100101 Firefox/141.0"
      },
      proxy: proxy,
      action: {
        name: "comment_to_post",
        params: {
          post_id: postId,
          content: commentText,
          image_url: null
        }
      }
    };
    request_body_for_log = requestPayload;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        throw new Error(`API returned non-JSON error (status ${response.status}): ${errorText.substring(0, 200)}...`);
      }
      await supabaseAdmin.from('manual_action_logs').insert({
          user_id: targetUserId, action_type: 'post_facebook_comment', request_url: apiUrl,
          request_body: requestPayload, response_status: response.status, response_body: errorJson
      });
      throw new Error(errorJson.status?.message || errorJson.message || `API Error: ${response.status}`);
    }

    const successResponseData = { status: { code: 1, message: "Success (body not read due to size)" } };
    await supabaseAdmin.from('manual_action_logs').insert({
        user_id: targetUserId, action_type: 'post_facebook_comment', request_url: apiUrl,
        request_body: requestPayload, response_status: response.status, response_body: successResponseData
    });

    // After successful post, update the report table
    const { error: updateReportError } = await supabaseAdmin
      .from('Bao_cao_Facebook')
      .update({ commented_at: new Date().toISOString() })
      .eq('source_post_id', postId);

    if (updateReportError) {
      console.error(`Failed to update commented_at status for post ${postId}:`, updateReportError.message);
    }

    return new Response(JSON.stringify({ success: true, message: 'Đăng comment thành công!', data: successResponseData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = `Lỗi khi gửi comment đến API: ${error.message}. Vui lòng kiểm tra lại API URL, API Key và Cookie Facebook.`;
    console.error("post-facebook-comment error:", error);
    
    if (user_id_for_log) {
        try {
            await supabaseAdmin.from('manual_action_logs').insert({
                user_id: user_id_for_log,
                action_type: 'post_facebook_comment',
                request_url: api_url_for_log,
                request_body: request_body_for_log,
                response_status: 500,
                response_body: { error: errorMessage, stack: error.stack }
            });
        } catch (logError) {
            console.error("Failed to save error log for manual action:", logError);
        }
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})