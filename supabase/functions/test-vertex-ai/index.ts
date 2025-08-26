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
  console.log("Bên trong hàm getGoogleAccessToken.");
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
    if (!serviceAccount.private_key || !serviceAccount.client_email) {
      throw new Error("Service Account JSON không hợp lệ hoặc thiếu 'private_key'/'client_email'.");
    }
    console.log("Phân tích Service Account JSON thành công.");
  } catch (e) {
    console.error("Lỗi phân tích Service Account Key:", e.message);
    throw new Error(`Lỗi phân tích Service Account Key: ${e.message}. Vui lòng kiểm tra lại bạn đã sao chép đúng toàn bộ nội dung file JSON chưa.`);
  }

  console.log("Đang import private key...");
  const privateKey = await jose.importPKCS8(serviceAccount.private_key, 'RS256');
  console.log("Import private key thành công.");
  
  console.log("Đang ký JWT...");
  const jwt = await new jose.SignJWT({
    scope: 'https://www.googleapis.com/auth/cloud-platform',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt()
    .setIssuer(serviceAccount.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setExpirationTime('1h')
    .sign(privateKey);
  console.log("Ký JWT thành công.");

  console.log("Đang lấy access token từ Google...");
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  console.log(`Google token endpoint đã phản hồi với status: ${response.status}`);

  const tokens = await response.json();
  if (!response.ok) {
    console.error("Lấy access token thất bại:", tokens);
    throw new Error(tokens.error_description || 'Không thể lấy access token từ Google.');
  }
  console.log("Lấy access token thành công.");
  return tokens.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("Function được gọi. Bắt đầu kiểm tra xác thực.");

    const serviceAccountKey = Deno.env.get('GCP_SERVICE_ACCOUNT_KEY');

    if (!serviceAccountKey) {
      throw new Error("Biến môi trường GCP_SERVICE_ACCOUNT_KEY là bắt buộc.");
    }
    console.log("Tải biến môi trường thành công.");

    console.log("Chuẩn bị lấy Google Access Token...");
    const accessToken = await getGoogleAccessToken(serviceAccountKey);
    console.log("Đã lấy Google Access Token thành công.");
    
    if (accessToken) {
        return new Response(JSON.stringify({ success: true, message: 'Xác thực với Google Cloud thành công! Kết nối Vertex AI đã sẵn sàng.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } else {
        throw new Error("Không nhận được access token mặc dù không có lỗi nào được báo cáo.");
    }

  } catch (error) {
    console.error("Đã bắt được lỗi trong khối chính:", error.message);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})