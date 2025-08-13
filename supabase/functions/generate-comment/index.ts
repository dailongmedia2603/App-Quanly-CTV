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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { serviceId, originalPostContent, originalComment, regenerateDirection } = await req.json();

    if (!serviceId) throw new Error("Service ID is required.");
    if (!originalPostContent) throw new Error("Original post content is required.");

    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Không tìm thấy người dùng.");

    const { data: apiKeys, error: apiKeyError } = await supabase
        .from('user_api_keys')
        .select('gemini_api_key, gemini_model')
        .eq('user_id', user.id)
        .single();

    if (apiKeyError || !apiKeys?.gemini_api_key || !apiKeys?.gemini_model) {
        throw new Error("Chưa cấu hình API Key cho Gemini.");
    }

    const { data: templateData, error: templateError } = await supabase
        .from('ai_prompt_templates')
        .select('prompt')
        .eq('template_type', 'comment')
        .single();

    if (templateError || !templateData?.prompt) {
        throw new Error("Không tìm thấy mẫu prompt cho việc tạo comment.");
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
            .map(doc => `Tên tài liệu: ${doc.title}\nYêu cầu AI khi đọc: ${doc.ai_prompt || 'Không có'}\nNội dung chi tiết:\n${doc.content || 'Không có'}`)
            .join('\n\n---\n\n');
    }

    let promptText = templateData.prompt;

    // **FIX:** Remove old, unsupported placeholders to prevent errors
    promptText = promptText.replace(/\[cảm xúc\]/gi, '');
    promptText = promptText.replace(/\[mục tiêu comment\]/gi, '');

    let finalPrompt = promptText
        .replace(/\[dịch vụ\]/gi, serviceForPrompt)
        .replace(/\[nội dung gốc\]/gi, originalPostContent)
        .replace(/\[biên tài liệu\]/gi, documentContent);

    if (regenerateDirection) {
        finalPrompt = `Dựa trên comment gốc sau:\n---\n${originalComment}\n---\nHãy tạo lại comment theo định hướng mới này: "${regenerateDirection}".\n\n${finalPrompt}`;
    }

    finalPrompt += `\n\n---
    QUAN TRỌNG: Vui lòng trả lời theo cấu trúc sau, sử dụng chính xác các đánh dấu này:
    **[NỘI DUNG COMMENT]**
    (Toàn bộ nội dung comment của bạn ở đây, sẵn sàng để sao chép và sử dụng)
    `;

    const genAI = new GoogleGenerativeAI(apiKeys.gemini_api_key);
    const model = genAI.getGenerativeModel({ model: apiKeys.gemini_model });

    const MAX_RETRIES = 3;
    let attempt = 0;
    let rawGeneratedText = '';
    let success = false;

    while (attempt < MAX_RETRIES && !success) {
        attempt++;
        try {
            const result = await model.generateContent(finalPrompt);
            const responseText = result.response.text();
            
            if (responseText && responseText.trim().length > 10) {
                rawGeneratedText = responseText;
                success = true;
            } else {
                console.log(`Attempt ${attempt} failed: AI returned empty or short response.`);
                if (attempt >= MAX_RETRIES) {
                    throw new Error("AI không thể tạo nội dung sau nhiều lần thử.");
                }
            }
        } catch (e) {
            console.error(`Attempt ${attempt} failed with error:`, e.message);
            if (attempt >= MAX_RETRIES) {
                throw new Error(`Tạo nội dung thất bại sau ${MAX_RETRIES} lần thử. Lỗi cuối cùng: ${e.message}`);
            }
        }
    }
    
    const cleanedGeneratedComment = cleanAiResponse(rawGeneratedText);

    await supabase.from('ai_generation_logs').insert({
        user_id: user.id,
        template_type: 'comment',
        final_prompt: finalPrompt,
        generated_content: rawGeneratedText
    });

    return new Response(JSON.stringify({ comment: cleanedGeneratedComment }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})