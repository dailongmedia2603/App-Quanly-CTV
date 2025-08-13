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

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { sessionId, serviceId, messages } = await req.json();
    if (!sessionId || !serviceId || !messages || messages.length === 0) {
      throw new Error("Yêu cầu thiếu thông tin cần thiết.");
    }

    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Không tìm thấy người dùng.");

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: apiKeys, error: apiKeyError } = await supabaseAdmin
        .from('app_settings')
        .select('gemini_api_key, gemini_model')
        .eq('id', 1)
        .single();

    if (apiKeyError || !apiKeys?.gemini_api_key || !apiKeys?.gemini_model) {
        throw new Error("Chưa cấu hình API Key cho Gemini trong cài đặt chung.");
    }

    const { data: templateData, error: templateError } = await supabase
        .from('ai_prompt_templates')
        .select('prompt')
        .eq('template_type', 'consulting')
        .single();

    if (templateError || !templateData?.prompt) {
        throw new Error("Không tìm thấy mẫu prompt cho việc tư vấn.");
    }

    const { data: serviceData, error: serviceError } = await supabase
        .from('document_services')
        .select('name, description')
        .eq('id', serviceId)
        .single();
    if (serviceError || !serviceData) throw new Error(`Could not find service with ID: ${serviceId}`);
    const serviceForPrompt = `${serviceData.name}${serviceData.description ? ` (Mô tả: ${serviceData.description})` : ''}`;

    let documentContent = "Không có tài liệu tham khảo.";
    const { data: documents } = await supabase
        .from('documents')
        .select('title, ai_prompt, content')
        .eq('service_id', serviceId);
    
    if (documents && documents.length > 0) {
        documentContent = documents
            .map(doc => `Tên tài liệu: ${doc.title}\nYêu cầu AI khi đọc: ${doc.ai_prompt || 'Không có'}\nNội dung chi tiết:\n${doc.content || 'Không có'}`)
            .join('\n\n---\n\n');
    }

    const latestUserMessage = messages[messages.length - 1].content;
    const historyMessages = messages.slice(0, -1);

    const chatHistory = historyMessages.map((msg: Message) => 
        `${msg.role === 'user' ? 'Khách hàng nhắn' : 'Bạn sẽ trả lời'}: ${msg.content}`
    ).join('\n');

    let promptText = templateData.prompt;
    promptText = promptText.replace(/\[câu hỏi khách hàng\]/gi, '');
    promptText = promptText.replace(/\[sản phẩm liên quan\]/gi, '');
    promptText = promptText.replace(/\[thông tin thêm\]/gi, '');

    let finalPrompt = promptText
        .replace(/\[dịch vụ\]/gi, serviceForPrompt)
        .replace(/\[lịch sử trò chuyện\]/gi, chatHistory || 'Đây là tin nhắn đầu tiên trong cuộc trò chuyện.')
        .replace(/\[tin nhắn cần trả lời\]/gi, latestUserMessage)
        .replace(/\[biên tài liệu\]/gi, documentContent);

    const genAI = new GoogleGenerativeAI(apiKeys.gemini_api_key);
    const model = genAI.getGenerativeModel({ model: apiKeys.gemini_model });

    const MAX_RETRIES = 3;
    let attempt = 0;
    let aiResponse = '';
    let success = false;

    while (attempt < MAX_RETRIES && !success) {
        attempt++;
        try {
            const result = await model.generateContent(finalPrompt);
            const responseText = result.response.text();
            
            if (responseText && responseText.trim().length > 0) {
                aiResponse = responseText;
                success = true;
            } else {
                console.log(`Attempt ${attempt} failed: AI returned empty response.`);
                if (attempt >= MAX_RETRIES) {
                    throw new Error("AI không phản hồi sau nhiều lần thử.");
                }
            }
        } catch (e) {
            console.error(`Attempt ${attempt} failed with error:`, e.message);
            if (attempt >= MAX_RETRIES) {
                throw new Error(`Tạo nội dung thất bại sau ${MAX_RETRIES} lần thử. Lỗi cuối cùng: ${e.message}`);
            }
        }
    }

    const { error: insertMsgError } = await supabase.from('consulting_messages').insert({
        session_id: sessionId,
        role: 'assistant',
        content: aiResponse,
    });
    if (insertMsgError) throw insertMsgError;

    await supabase.from('ai_generation_logs').insert({
        user_id: user.id,
        template_type: 'consulting',
        final_prompt: finalPrompt,
        generated_content: aiResponse
    });

    return new Response(JSON.stringify({ reply: aiResponse }), {
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