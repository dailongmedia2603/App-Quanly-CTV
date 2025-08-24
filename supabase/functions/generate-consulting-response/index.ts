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
    const { sessionId, serviceIds, messages, customerSalutation } = await req.json();
    if (!sessionId || !serviceIds || serviceIds.length === 0 || !messages || messages.length === 0) {
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
        .eq('template_type', 'consulting')
        .single();

    if (templateError || !templateData?.prompt) {
        throw new Error("Không tìm thấy mẫu prompt cho việc tư vấn.");
    }

    const { data: serviceData, error: serviceError } = await supabaseAdmin
        .from('document_services')
        .select('name, description')
        .in('id', serviceIds);
    if (serviceError || !serviceData) throw new Error(`Could not find services with IDs: ${serviceIds.join(', ')}`);
    const serviceForPrompt = serviceData.map(s => `${s.name}${s.description ? ` (Mô tả: ${s.description})` : ''}`).join('; ');

    let documentContent = "Không có tài liệu tham khảo.";
    const { data: documents } = await supabaseAdmin
        .from('documents')
        .select('title, ai_prompt, content')
        .in('service_id', serviceIds);
    
    if (documents && documents.length > 0) {
        documentContent = documents
            .map(doc => `Tên tài liệu: ${doc.title}\nYêu cầu AI khi đọc: ${doc.ai_prompt || 'Không có'}\nNội dung chi tiết:\n${doc.content || 'Không có'}`)
            .join('\n\n---\n\n');
    }

    let quoteTemplatesContent = "Không có mẫu báo giá tham khảo cho các dịch vụ này.";
    const { data: quoteTemplates } = await supabaseAdmin
        .from('quote_templates')
        .select('name, content')
        .in('service_id', serviceIds);

    if (quoteTemplates && quoteTemplates.length > 0) {
        quoteTemplatesContent = quoteTemplates
            .map(t => `--- MẪU BÁO GIÁ: ${t.name} ---\n${t.content}`)
            .join('\n\n');
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
        .replace(/\[biên tài liệu\]/gi, documentContent)
        .replace(/\[báo giá dịch vụ\]/gi, quoteTemplatesContent);

    if (customerSalutation) {
        finalPrompt = `QUAN TRỌNG: Khách hàng là "${customerSalutation}". Hãy xưng hô cho phù hợp trong câu trả lời của bạn (ví dụ: "Chào ${customerSalutation}", "Dạ ${customerSalutation} ạ", "bên em gửi ${customerSalutation}").\n\n---\n\n${finalPrompt}`;
    }

    const MAX_RETRIES = 3;
    let lastError: Error | null = null;
    let aiResponse = '';

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { data: geminiApiKey, error: apiKeyError } = await supabaseAdmin.rpc('get_next_gemini_api_key');
        if (apiKeyError || !geminiApiKey) {
            throw new Error("Chưa cấu hình hoặc không thể lấy Gemini API Key.");
        }

        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: settings.gemini_model });

        const result = await model.generateContent(finalPrompt);
        const responseText = result.response.text();
        
        if (responseText && responseText.trim().length > 0) {
            aiResponse = responseText;
            lastError = null;
            break;
        } else {
            lastError = new Error(`AI không phản hồi sau lần thử ${attempt}.`);
        }
      } catch (e) {
        lastError = new Error(`Tạo nội dung thất bại ở lần thử ${attempt}. Lỗi: ${e.message}`);
        console.error(lastError.message);
      }
    }

    if (lastError) {
      throw lastError;
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