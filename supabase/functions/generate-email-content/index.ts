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

const safetyInstruction = "Bạn là một trợ lý AI chuyên nghiệp, hữu ích và an toàn. Hãy tập trung vào việc tạo ra nội dung marketing chất lượng cao, phù hợp với ngữ cảnh được cung cấp. TUYỆT ĐỐI TRÁNH các chủ đề nhạy cảm, gây tranh cãi, hoặc có thể bị hiểu lầm là tiêu cực. Luôn duy trì một thái độ tích cực và chuyên nghiệp.\n\n---\n\n";

const logErrorToDb = async (supabaseAdmin: any, userId: string, functionName: string, error: Error, context: any) => {
  try {
    await supabaseAdmin.from('ai_error_logs').insert({
      user_id: userId,
      error_message: error.message,
      function_name: functionName,
      context: context,
    });
  } catch (dbError) {
    console.error("Failed to log error to DB:", dbError);
  }
};

async function getGoogleAccessToken(serviceAccountJson: string) {
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
    if (!serviceAccount.private_key || !serviceAccount.client_email) {
      throw new Error("Service Account JSON không hợp lệ hoặc thiếu 'private_key'/'client_email'.");
    }
  } catch (e) {
    throw new Error(`Lỗi phân tích Service Account Key: ${e.message}.`);
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

  let userId: string | null = null;
  const functionName = 'generate-email-content';
  let requestBody: any = {};

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Không tìm thấy người dùng.");
    userId = user.id;

    requestBody = await req.json();
    const { name, serviceId, emailGoal, additionalInfo, phoneNumber, ctaLink } = requestBody;
    if (!name || !serviceId || !emailGoal) {
      throw new Error("Cần có tên nội dung, dịch vụ và mục tiêu email.");
    }

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    const { data: settings, error: settingsError } = await supabaseAdmin.from('app_settings').select('gemini_model').eq('id', 1).single();
    if (settingsError || !settings?.gemini_model) throw new Error("Chưa cấu hình model Gemini.");

    const [serviceRes, templateRes, documentsRes] = await Promise.all([
      supabaseAdmin.from('document_services').select('name, description').eq('id', serviceId).single(),
      supabaseAdmin.from('ai_prompt_templates').select('prompt').eq('template_type', 'email').single(),
      supabaseAdmin.from('documents').select('title, content').eq('service_id', serviceId)
    ]);

    if (serviceRes.error || !serviceRes.data) throw new Error("Không tìm thấy dịch vụ.");
    if (templateRes.error || !templateRes.data?.prompt) throw new Error("Không tìm thấy mẫu prompt cho email.");

    const serviceForPrompt = `${serviceRes.data.name}${serviceRes.data.description ? ` (Mô tả: ${serviceRes.data.description})` : ''}`;
    const documentContent = documentsRes.data && documentsRes.data.length > 0
      ? documentsRes.data.map(doc => `Tài liệu: ${doc.title}\nNội dung: ${doc.content}`).join('\n\n---\n\n')
      : "Không có tài liệu tham khảo.";

    const contactInfo = `<p><b>VUA SEEDING - TRUYỀN THÔNG ĐIỀU HƯỚNG CỘNG ĐỒNG</b><br>Hotline: ${phoneNumber || 'Chưa cung cấp'}<br>Website: Vuaseeding.top</p>`;

    let basePrompt = templateRes.data.prompt
      .replace(/\[dịch vụ\]/gi, serviceForPrompt)
      .replace(/\[mục tiêu\]/gi, emailGoal)
      .replace(/\[thông tin thêm\]/gi, additionalInfo || 'Không có')
      .replace(/\[biên tài liệu\]/gi, documentContent)
      .replace(/\[thông tin liên hệ\]/gi, contactInfo)
      .replace(/\[link_cta\]/gi, ctaLink || 'https://vuaseeding.top/lien-he');

    basePrompt += `\n\n---
    QUAN TRỌNG: Vui lòng trả lời bằng một đối tượng JSON hợp lệ DUY NHẤT, không có văn bản giải thích nào khác. Đối tượng JSON phải có cấu trúc sau:
    {
      "subject": "Tiêu đề email hấp dẫn của bạn ở đây",
      "body": "Nội dung email của bạn ở đây, được định dạng bằng HTML. Sử dụng các thẻ HTML cơ bản như <p>, <b>, <ul>, <li>, <a>."
    }
    `;

    const finalPrompt = safetyInstruction + basePrompt;

    // --- Vertex AI Integration ---
    const gcpProjectId = Deno.env.get('GCP_PROJECT_ID');
    const gcpRegion = Deno.env.get('GCP_REGION');
    const serviceAccountKey = Deno.env.get('GCP_SERVICE_ACCOUNT_KEY');
    if (!gcpProjectId || !gcpRegion || !serviceAccountKey) {
      throw new Error("Các biến môi trường GCP để kết nối Vertex AI chưa được cấu hình.");
    }

    const accessToken = await getGoogleAccessToken(serviceAccountKey);
    const vertexApiUrl = `https://${gcpRegion}-aiplatform.googleapis.com/v1/projects/${gcpProjectId}/locations/${gcpRegion}/publishers/google/models/${settings.gemini_model}:generateContent`;

    const vertexResponse = await fetch(vertexApiUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: finalPrompt }] }] }),
    });

    const vertexResponseText = await vertexResponse.text();
    if (!vertexResponse.ok) {
      throw new Error(`Lỗi từ Vertex AI: ${vertexResponse.status} ${vertexResponseText}`);
    }
    
    const vertexData = JSON.parse(vertexResponseText);
    const rawGeneratedContent = vertexData.candidates[0]?.content?.parts[0]?.text;
    if (!rawGeneratedContent) {
      throw new Error("Vertex AI không trả về nội dung.");
    }
    // --- End Vertex AI Integration ---

    let aiResult;
    try {
        const cleanedResponse = rawGeneratedContent.replace(/```json/g, '').replace(/```/g, '').trim();
        aiResult = JSON.parse(cleanedResponse);
    } catch (e) {
        console.error("Failed to parse AI JSON response:", rawGeneratedContent);
        throw new Error("AI đã trả về một định dạng JSON không hợp lệ.");
    }

    const { subject, body } = aiResult;
    if (!subject || !body) {
        throw new Error("Phản hồi JSON của AI thiếu các trường 'subject' hoặc 'body'.");
    }

    const { data: savedContent, error: saveError } = await supabaseAdmin
      .from('email_contents')
      .insert({ user_id: user.id, name, service_id: serviceId, subject, body })
      .select()
      .single();

    if (saveError) throw new Error(`Lưu nội dung thất bại: ${saveError.message}`);

    await supabaseAdmin.from('ai_generation_logs').insert({ user_id: user.id, template_type: 'email', final_prompt: finalPrompt, generated_content: rawGeneratedContent });

    return new Response(JSON.stringify(savedContent), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

  } catch (error) {
    console.error(`Error in ${functionName}:`, error);
    if (userId) {
      const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
      await logErrorToDb(supabaseAdmin, userId, functionName, error, requestBody);
    }
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})