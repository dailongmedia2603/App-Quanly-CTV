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

const cleanAiResponse = (rawText: string): string => {
  if (!rawText) return '';
  let text = rawText.trim();
  const contentMarker = "**[NỘI DUNG BÀI ĐĂNG]**";
  const markerIndex = text.indexOf(contentMarker);
  if (markerIndex !== -1) {
    text = text.substring(markerIndex + contentMarker.length).trim();
  } else {
    const lines = text.split('\n');
    let firstContentLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const trimmedLine = lines[i].trim();
      if (trimmedLine === '') continue;
      if (trimmedLine.startsWith('#') || trimmedLine.startsWith('*')) {
        firstContentLineIndex = i;
        break;
      }
      const isPreamble = /^(chắc chắn rồi|dưới đây là|here is|tuyệt vời|tất nhiên|here's a draft|here's the post)/i.test(trimmedLine);
      if (!isPreamble) {
        firstContentLineIndex = i;
        break;
      }
    }
    if (firstContentLineIndex !== -1) {
      text = lines.slice(firstContentLineIndex).join('\n').trim();
    }
  }
  text = text.replace(/^```(markdown|md|)\s*\n/i, '');
  text = text.replace(/\n\s*```$/, '');
  return text;
};

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
  const jwt = await new jose.SignJWT({ scope: 'https://www.googleapis.com/auth/cloud-platform' })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt()
    .setIssuer(serviceAccount.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setExpirationTime('1h')
    .sign(privateKey);
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  const tokens = await response.json();
  if (!response.ok) throw new Error(tokens.error_description || 'Không thể lấy access token từ Google.');
  return tokens.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  let userId: string | null = null;
  const functionName = 'generate-post';
  let requestBody: any = {};

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Không tìm thấy người dùng.");
    userId = user.id;

    requestBody = await req.json();
    const { serviceId, postType, industry, direction, originalPost, regenerateDirection, wordCount } = requestBody;
    if (!serviceId) throw new Error("Service ID is required.");

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const { data: settings, error: settingsError } = await supabaseAdmin.from('app_settings').select('gemini_model').eq('id', 1).single();
    if (settingsError || !settings?.gemini_model) throw new Error("Chưa cấu hình model cho Gemini trong cài đặt chung.");

    const { data: templateData, error: templateError } = await supabase.from('ai_prompt_templates').select('prompt').eq('template_type', 'post').single();
    if (templateError || !templateData?.prompt) throw new Error("Không tìm thấy mẫu prompt cho việc tạo bài viết.");

    const { data: serviceData, error: serviceError } = await supabase.from('document_services').select('name, description').eq('id', serviceId).single();
    if (serviceError || !serviceData) throw new Error(`Could not find service with ID: ${serviceId}`);
    const serviceForPrompt = `${serviceData.name}${serviceData.description ? ` (Mô tả: ${serviceData.description})` : ''}`;

    let documentContent = "Không có tài liệu tham khảo.";
    const { data: documents, error: documentsError } = await supabase.from('documents').select('title, ai_prompt, content').eq('service_id', serviceId);
    if (documentsError) console.error("Error fetching documents for prompt:", documentsError);
    else if (documents && documents.length > 0) {
        documentContent = documents.map(doc => `Tên tài liệu: ${doc.title}\nYêu cầu AI khi đọc: ${doc.ai_prompt || 'Không có'}\nNội dung chi tiết:\n${doc.content || 'Không có'}`).join('\n\n---\n\n');
    }

    let basePrompt = templateData.prompt
        .replace(/\[dịch vụ\]/gi, serviceForPrompt)
        .replace(/\[dạng bài\]/gi, postType)
        .replace(/\[ngành\]/gi, industry)
        .replace(/\[định hướng\]/gi, direction || 'Không có')
        .replace(/\[biên tài liệu\]/gi, documentContent);

    if (regenerateDirection) {
        basePrompt = `Dựa trên bài viết gốc sau:\n---\n${originalPost}\n---\nHãy tạo lại bài viết theo định hướng mới này: "${regenerateDirection}".\n\n${basePrompt}`;
    }
    if (wordCount && typeof wordCount === 'number' && wordCount > 0) {
        basePrompt += `\n\nYêu cầu về độ dài: Bài viết nên có khoảng ${wordCount} từ.`;
    }
    basePrompt += `\n\n---
    QUAN TRỌNG: Vui lòng trả lời theo cấu trúc sau, sử dụng chính xác các đánh dấu này:
    **[GỢI Ý HÌNH ẢNH ĐI KÈM]**
    (Gợi ý hình ảnh của bạn ở đây)
    ---
    **[NỘI DUNG BÀI ĐĂNG]**
    (Toàn bộ nội dung bài đăng của bạn ở đây, sẵn sàng để sao chép và sử dụng)
    `;

    const finalPrompt = safetyInstruction + basePrompt;

    // --- Vertex AI Integration ---
    const gcpProjectId = Deno.env.get('GCP_PROJECT_ID');
    const serviceAccountKey = Deno.env.get('GCP_SERVICE_ACCOUNT_KEY');
    if (!gcpProjectId || !serviceAccountKey) throw new Error("Các biến môi trường GCP để kết nối Vertex AI chưa được cấu hình.");

    const accessToken = await getGoogleAccessToken(serviceAccountKey);
    const location = "global"; // Use global endpoint
    const vertexApiUrl = `https://global-aiplatform.googleapis.com/v1/projects/${gcpProjectId}/locations/${location}/publishers/google/models/${settings.gemini_model}:generateContent`;

    const vertexResponse = await fetch(vertexApiUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: finalPrompt }] }] }),
    });

    const vertexResponseText = await vertexResponse.text();
    if (!vertexResponse.ok) throw new Error(`Lỗi từ Vertex AI: ${vertexResponse.status} ${vertexResponseText}`);
    
    const vertexData = JSON.parse(vertexResponseText);
    const rawGeneratedText = vertexData.candidates[0]?.content?.parts[0]?.text;
    if (!rawGeneratedText) throw new Error("Vertex AI không trả về nội dung.");
    // --- End Vertex AI Integration ---
    
    const cleanedGeneratedText = cleanAiResponse(rawGeneratedText);

    await supabase.from('ai_generation_logs').insert({ user_id: user.id, template_type: 'post', final_prompt: finalPrompt, generated_content: rawGeneratedText });

    return new Response(JSON.stringify({ post: cleanedGeneratedText }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

  } catch (error) {
    console.error(`Error in ${functionName}:`, error);
    if (userId) {
      const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
      await logErrorToDb(supabaseAdmin, userId, functionName, error, requestBody);
    }
    return new Response(JSON.stringify({ error: "Đang bị quá tải.... Hãy bấm tạo lại nhé" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
})