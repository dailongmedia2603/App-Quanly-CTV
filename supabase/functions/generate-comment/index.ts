// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const safetyInstruction = "Bạn là một trợ lý AI chuyên nghiệp, hữu ích và an toàn. Hãy tập trung vào việc tạo ra nội dung marketing chất lượng cao, phù hợp với ngữ cảnh được cung cấp. TUYỆT ĐỐI TRÁNH các chủ đề nhạy cảm, gây tranh cãi, hoặc có thể bị hiểu lầm là tiêu cực. Luôn duy trì một thái độ tích cực và chuyên nghiệp.\n\n---\n\n";

const cleanAiResponse = (rawText: string): string => {
  if (!rawText) return '';
  let text = rawText.trim();
  const contentMarker = "**[NỘI DUNG COMMENT]**";
  const markerIndex = text.indexOf(contentMarker);
  if (markerIndex !== -1) {
    text = text.substring(markerIndex + contentMarker.length).trim();
  } else {
    const lines = text.split('\n');
    let firstContentLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const trimmedLine = lines[i].trim();
      if (trimmedLine === '') continue;
      const isPreamble = /^(chắc chắn rồi|dưới đây là|here is|tuyệt vời|tất nhiên|here's a draft|here's the comment)/i.test(trimmedLine);
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

const callMultiAppAI = async (supabaseAdmin: any, prompt: string) => {
  const { data: settings, error: settingsError } = await supabaseAdmin
    .from('app_settings')
    .select('ai_model_name, multiappai_api_url, multiappai_api_key')
    .eq('id', 1)
    .single();

  if (settingsError || !settings) throw new Error("Could not load AI settings.");
  const { ai_model_name, multiappai_api_url, multiappai_api_key } = settings;
  if (!ai_model_name || !multiappai_api_url || !multiappai_api_key) {
    throw new Error("MultiApp AI URL, Key, or Model Name is not configured in settings.");
  }

  const response = await fetch(`${multiappai_api_url.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${multiappai_api_key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: ai_model_name,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    }),
  });

  const responseData = await response.json();

  if (!response.ok) {
    const errorMessage = responseData.error?.message || `AI API error: ${response.status}`;
    throw new Error(errorMessage);
  }

  const content = responseData.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI did not return any content.");
  }

  return content;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  let userId: string | null = null;
  const functionName = 'generate-comment';
  let requestBody: any = {};

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Không tìm thấy người dùng.");
    userId = user.id;

    requestBody = await req.json();
    const { serviceId, originalPostContent, originalComment, regenerateDirection } = requestBody;
    if (!serviceId || !originalPostContent) throw new Error("Service ID and original post content are required.");

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    
    const { data: templateData, error: templateError } = await supabase.from('ai_prompt_templates').select('prompt').eq('template_type', 'comment').single();
    if (templateError || !templateData?.prompt) throw new Error("Không tìm thấy mẫu prompt cho việc tạo comment.");

    const { data: serviceData, error: serviceError } = await supabase.from('document_services').select('name, description').eq('id', serviceId).single();
    if (serviceError || !serviceData) throw new Error(`Could not find service with ID: ${serviceId}`);
    const serviceForPrompt = `${serviceData.name}${serviceData.description ? ` (Mô tả: ${serviceData.description})` : ''}`;

    let documentContent = "Không có tài liệu tham khảo.";
    const { data: documents, error: documentsError } = await supabase.from('documents').select('title, ai_prompt, content').eq('service_id', serviceId);
    if (documentsError) console.error("Error fetching documents for prompt:", documentsError);
    else if (documents && documents.length > 0) {
        documentContent = documents.map(doc => `Tên tài liệu: ${doc.title}\nYêu cầu AI khi đọc: ${doc.ai_prompt || 'Không có'}\nNội dung chi tiết:\n${doc.content || 'Không có'}`).join('\n\n---\n\n');
    }

    let promptText = templateData.prompt;
    promptText = promptText.replace(/\[cảm xúc\]/gi, '');
    promptText = promptText.replace(/\[mục tiêu comment\]/gi, '');

    let basePrompt = promptText
        .replace(/\[dịch vụ\]/gi, serviceForPrompt)
        .replace(/\[nội dung gốc\]/gi, originalPostContent)
        .replace(/\[biên tài liệu\]/gi, documentContent);

    if (regenerateDirection) {
        basePrompt = `Dựa trên comment gốc sau:\n---\n${originalComment}\n---\nHãy tạo lại comment theo định hướng mới này: "${regenerateDirection}".\n\n${basePrompt}`;
    }
    basePrompt += `\n\n---
    QUAN TRỌNG: Vui lòng trả lời theo cấu trúc sau, sử dụng chính xác các đánh dấu này:
    **[NỘI DUNG COMMENT]**
    (Toàn bộ nội dung comment của bạn ở đây, sẵn sàng để sao chép và sử dụng)
    `;

    const finalPrompt = safetyInstruction + basePrompt;

    const rawGeneratedText = await callMultiAppAI(supabaseAdmin, finalPrompt);
    
    const cleanedGeneratedComment = cleanAiResponse(rawGeneratedText);

    await supabase.from('ai_generation_logs').insert({ user_id: user.id, template_type: 'comment', final_prompt: finalPrompt, generated_content: rawGeneratedText });

    return new Response(JSON.stringify({ comment: cleanedGeneratedComment }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

  } catch (error) {
    console.error(`Error in ${functionName}:`, error);
    if (userId) {
      const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
      await logErrorToDb(supabaseAdmin, userId, functionName, error, requestBody);
    }
    return new Response(JSON.stringify({ error: "Đang bị quá tải.... Hãy bấm tạo lại nhé" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
})