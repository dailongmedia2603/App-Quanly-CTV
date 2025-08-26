// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
// @ts-ignore
import * as jose from 'https://deno.land/x/jose@v5.6.3/index.ts'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getGoogleAccessToken(serviceAccountJson: string) {
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
    if (!serviceAccount.private_key || !serviceAccount.client_email) {
      throw new Error("Service Account JSON không hợp lệ hoặc thiếu 'private_key'/'client_email'.");
    }
  } catch (e) {
    throw new Error(`Lỗi phân tích Service Account Key: ${e.message}. Vui lòng kiểm tra lại bạn đã sao chép đúng toàn bộ nội dung file JSON chưa.`);
  }

  const privateKey = await jose.importPKCS8(serviceAccount.private_key, 'RS256');
  
  const jwt = await new jose.SignJWT({
    scope: 'https://www.googleapis.com/auth/cloud-platform',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt()
    .setIssuer(serviceAccount.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setExpirationTime('1h')
    .sign(privateKey);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokens = await response.json();
  if (!response.ok) {
    throw new Error(tokens.error_description || 'Không thể lấy access token từ Google.');
  }
  return tokens.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 1. Get environment variables
    const gcpProjectId = Deno.env.get('GCP_PROJECT_ID');
    const gcpRegion = Deno.env.get('GCP_REGION');
    const serviceAccountKey = Deno.env.get('GCP_SERVICE_ACCOUNT_KEY');

    if (!gcpProjectId || !gcpRegion || !serviceAccountKey) {
      throw new Error("Một hoặc nhiều biến môi trường GCP (PROJECT_ID, REGION, SERVICE_ACCOUNT_KEY) chưa được cấu hình.");
    }

    // 2. Get Gemini model from app_settings
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('app_settings')
      .select('gemini_model')
      .eq('id', 1)
      .single();

    if (settingsError || !settings?.gemini_model) {
      throw new Error("Chưa cấu hình model Gemini trong Cài đặt chung của ứng dụng.");
    }
    const geminiModel = settings.gemini_model;

    // 3. Get Access Token
    const accessToken = await getGoogleAccessToken(serviceAccountKey);

    // 4. Construct Vertex AI API URL and make a test call
    const vertexApiUrl = `https://${gcpRegion}-aiplatform.googleapis.com/v1/projects/${gcpProjectId}/locations/${gcpRegion}/publishers/google/models/${geminiModel}:generateContent`;

    const vertexResponse = await fetch(vertexApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: "Hello" }]
        }]
      }),
    });

    const vertexResponseText = await vertexResponse.text();

    if (!vertexResponse.ok) {
      let errorMessage = `Lỗi từ Vertex AI: ${vertexResponse.status}`;
      try {
        const errorJson = JSON.parse(vertexResponseText);
        errorMessage += ` - ${errorJson.error?.message || vertexResponseText}`;
      } catch (e) {
        errorMessage += ` - ${vertexResponseText}`;
      }
      throw new Error(errorMessage);
    }

    // 5. Check for valid response
    const vertexData = JSON.parse(vertexResponseText);
    if (!vertexData.candidates || vertexData.candidates.length === 0) {
      throw new Error("Kết nối thành công nhưng Vertex AI không trả về kết quả hợp lệ.");
    }

    return new Response(JSON.stringify({ success: true, message: 'Kết nối Vertex AI thành công!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Lỗi khi kiểm tra kết nối Vertex AI:", error.message);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})