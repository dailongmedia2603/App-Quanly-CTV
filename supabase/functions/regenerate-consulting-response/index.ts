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

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

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

  try {
    const { messageId, sessionId, serviceIds, messages, regenerateDirection, customerSalutation } = await req.json();
    if (!messageId || !sessionId || !serviceIds || serviceIds.length === 0 || !messages) {
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

    // Find the last user message in the provided history
    let lastUserMessageContent = '';
    let historyForPrompt: Message[] = [];
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
            lastUserMessageContent = messages[i].content;
            historyForPrompt = messages.slice(0, i);
            break;
        }
    }

    if (!lastUserMessageContent) {
        throw new Error("Could not find a user message to respond to in the history.");
    }

    const chatHistory = historyForPrompt.map((msg: Message) => 
        `${msg.role === 'user' ? 'Khách hàng nhắn' : 'Bạn sẽ trả lời'}: ${msg.content}`
    ).join('\n');

    let promptText = templateData.prompt;

    promptText = promptText.replace(/\[câu hỏi khách hàng\]/gi, '');
    promptText = promptText.replace(/\[sản phẩm liên quan\]/gi, '');
    promptText = promptText.replace(/\[thông tin thêm\]/gi, '');

    let finalPrompt = promptText
        .replace(/\[dịch vụ\]/gi, serviceForPrompt)
        .replace(/\[lịch sử trò chuyện\]/gi, chatHistory || 'Đây là tin nhắn đầu tiên trong cuộc trò chuyện.')
        .replace(/\[tin nhắn cần trả lời\]/gi, lastUserMessageContent)
        .replace(/\[biên tài liệu\]/gi, documentContent)
        .replace(/\[báo giá dịch vụ\]/gi, quoteTemplatesContent);

    finalPrompt = `Hãy viết lại câu trả lời của bạn dựa trên định hướng mới sau: "${regenerateDirection || 'Hãy viết lại theo một cách khác.'}".\n\n${finalPrompt}`;

    if (customerSalutation) {
        finalPrompt = `QUAN TRỌNG: Khách hàng là "${customerSalutation}". Hãy xưng hô cho phù hợp trong câu trả lời của bạn (ví dụ: "Chào ${customerSalutation}", "Dạ ${customerSalutation} ạ", "bên em gửi ${customerSalutation}").\n\n---\n\n${finalPrompt}`;
    }

    finalPrompt = safetyInstruction + finalPrompt;

    const aiResponse = await callMultiAppAI(supabaseAdmin, finalPrompt);

    // UPDATE the existing message in the database
    const { error: updateMsgError } = await supabase.from('consulting_messages')
        .update({ content: aiResponse })
        .eq('id', messageId);
    if (updateMsgError) throw updateMsgError;

    // Log the generation
    await supabase.from('ai_generation_logs').insert({
        user_id: user.id,
        template_type: 'consulting',
        final_prompt: `[REGENERATION]\n${finalPrompt}`,
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