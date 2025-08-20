// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
// @ts-ignore
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.15.0";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const cleanAiResponse = (rawText: string): string => {
  if (!rawText) return '';
  let text = rawText.trim();

  // New logic: Look for a specific marker for the main content
  const contentMarker = "**[NỘI DUNG BÀI ĐĂNG]**";
  const markerIndex = text.indexOf(contentMarker);

  if (markerIndex !== -1) {
    // If marker is found, take everything after it and trim
    text = text.substring(markerIndex + contentMarker.length).trim();
  } else {
    // Fallback to old logic if marker is not found
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

  // Remove markdown code block fences from the final text
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  let userId: string | null = null;
  const functionName = 'generate-post';
  let requestBody: any = {};

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Không tìm thấy người dùng.");
    userId = user.id;

    requestBody = await req.json();
    const { serviceId, postType, industry, direction, originalPost, regenerateDirection, wordCount } = requestBody;

    if (!serviceId) throw new Error("Service ID is required.");

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
        throw new Error("Chưa cấu hình model cho Gemini trong cài đặt chung.");
    }

    const { data: templateData, error: templateError } = await supabase
        .from('ai_prompt_templates')
        .select('prompt')
        .eq('template_type', 'post')
        .single();

    if (templateError || !templateData?.prompt) {
        throw new Error("Không tìm thấy mẫu prompt cho việc tạo bài viết.");
    }

    const { data: serviceData, error: serviceError } = await supabase
        .from('document_services')
        .select('name, description')
        .eq('id', serviceId)
        .single();
    if (serviceError || !serviceData) throw new Error(`Could not find service with ID: ${serviceId}`);
    const serviceForPrompt = `${serviceData.name}${serviceData.description ? ` (Mô tả: ${serviceData.description})` : ''}`;

    let documentContent = "Không có tài liệu tham khảo.";
    const { data: documents, error: documentsError } = await supabase
        .from('documents')
        .select('title, ai_prompt, content')
        .eq('service_id', serviceId);
    
    if (documentsError) {
        console.error("Error fetching documents for prompt:", documentsError);
    } else if (documents && documents.length > 0) {
        documentContent = documents
            .map(doc => {
                let docString = `Tên tài liệu: ${doc.title}`;
                if (doc.ai_prompt) {
                    docString += `\nYêu cầu AI khi đọc: ${doc.ai_prompt}`;
                }
                if (doc.content) {
                    docString += `\nNội dung chi tiết:\n${doc.content}`;
                }
                return docString;
            })
            .filter(Boolean)
            .join('\n\n---\n\n');
    }

    let finalPrompt = templateData.prompt
        .replace(/\[dịch vụ\]/gi, serviceForPrompt)
        .replace(/\[dạng bài\]/gi, postType)
        .replace(/\[ngành\]/gi, industry)
        .replace(/\[định hướng\]/gi, direction || 'Không có')
        .replace(/\[biên tài liệu\]/gi, documentContent);

    if (regenerateDirection) {
        finalPrompt = `Dựa trên bài viết gốc sau:\n---\n${originalPost}\n---\nHãy tạo lại bài viết theo định hướng mới này: "${regenerateDirection}".\n\n${finalPrompt}`;
    }

    if (wordCount && typeof wordCount === 'number' && wordCount > 0) {
        finalPrompt += `\n\nYêu cầu về độ dài: Bài viết nên có khoảng ${wordCount} từ.`;
    }

    finalPrompt += `\n\n---
    QUAN TRỌNG: Vui lòng trả lời theo cấu trúc sau, sử dụng chính xác các đánh dấu này:
    **[GỢI Ý HÌNH ẢNH ĐI KÈM]**
    (Gợi ý hình ảnh của bạn ở đây)
    ---
    **[NỘI DUNG BÀI ĐĂNG]**
    (Toàn bộ nội dung bài đăng của bạn ở đây, sẵn sàng để sao chép và sử dụng)
    `;

    const MAX_RETRIES = 3;
    let lastError: Error | null = null;
    let rawGeneratedText = '';

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { data: geminiApiKey, error: apiKeyError } = await supabaseAdmin.rpc('get_next_gemini_api_key');
        if (apiKeyError || !geminiApiKey) {
            throw new Error("Không thể lấy Gemini API Key từ hệ thống.");
        }

        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: settings.gemini_model });

        const result = await model.generateContent(finalPrompt);
        const responseText = result.response.text();
        
        if (responseText && responseText.trim().length > 20) {
            rawGeneratedText = responseText;
            lastError = null;
            break; 
        } else {
            lastError = new Error(`AI trả về nội dung trống hoặc quá ngắn ở lần thử ${attempt}.`);
            console.log(lastError.message);
        }
      } catch (e) {
        lastError = new Error(`Lần thử ${attempt} thất bại: ${e.message}`);
        console.error(lastError.message);
      }
    }

    if (lastError) {
      throw lastError;
    }
    
    const cleanedGeneratedText = cleanAiResponse(rawGeneratedText);

    const { error: logError } = await supabase.from('ai_generation_logs').insert({
        user_id: user.id,
        template_type: 'post',
        final_prompt: finalPrompt,
        generated_content: rawGeneratedText
    });

    if (logError) {
        console.error('Failed to log AI generation:', logError);
    }

    return new Response(JSON.stringify({ post: cleanedGeneratedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(`Error in ${functionName}:`, error);
    if (userId) {
      const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
      await logErrorToDb(supabaseAdmin, userId, functionName, error, requestBody);
    }
    return new Response(JSON.stringify({ error: "Đang bị quá tải.... Hãy bấm tạo lại nhé" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})