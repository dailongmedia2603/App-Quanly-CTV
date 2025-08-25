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
  const serviceAccount = JSON.parse(serviceAccountJson);
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
    throw new Error(tokens.error_description || 'Failed to fetch access token');
  }
  return tokens.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const gcpProjectId = Deno.env.get('GCP_PROJECT_ID');
    const gcpRegion = Deno.env.get('GCP_REGION');
    const serviceAccountKey = Deno.env.get('GCP_SERVICE_ACCOUNT_KEY');

    if (!gcpProjectId || !gcpRegion || !serviceAccountKey) {
      throw new Error("Các biến môi trường GCP_PROJECT_ID, GCP_REGION, và GCP_SERVICE_ACCOUNT_KEY là bắt buộc.");
    }

    const accessToken = await getGoogleAccessToken(serviceAccountKey);
    
    const model = "gemini-1.5-pro-latest"; // Sử dụng tên model Vertex AI hợp lệ
    const vertexApiUrl = `https://${gcpRegion}-aiplatform.googleapis.com/v1/projects/${gcpProjectId}/locations/${gcpRegion}/publishers/google/models/${model}:streamGenerateContent`;

    const response = await fetch(vertexApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hello" }] }],
      }),
    });

    if (response.ok) {
      return new Response(JSON.stringify({ success: true, message: 'Kết nối Vertex AI thành công!' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Kết nối thất bại. Vui lòng kiểm tra lại cấu hình.');
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})