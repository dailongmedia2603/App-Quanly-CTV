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
  const functionName = 'generate-email-content';
  let requestBody: any = {};

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Không tìm thấy người dùng.");
    userId = user.id;

    requestBody = await req.json();
    const { name, serviceId, emailGoal, additionalInfo } = requestBody;
    if (!name || !serviceId || !emailGoal) {
      throw new Error("Cần có tên nội dung, dịch vụ và mục tiêu email.");
    }

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    const { data: geminiApiKey, error: apiKeyError } = await supabaseAdmin.rpc('get_next_gemini_api_key');
    if (apiKeyError || !geminiApiKey) throw new Error("Không thể lấy Gemini API Key.");
    
    const { data: settings, error: settingsError } = await supabaseAdmin.from('app_settings').select('gemini_model').eq('id', 1).single();
    if (settingsError || !settings?.gemini_model) throw new Error("Chưa cấu hình model Gemini.");

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: settings.gemini_model });

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

    let finalPrompt = templateRes.data.prompt
      .replace(/\[dịch vụ\]/gi, serviceForPrompt)
      .replace(/\[mục tiêu\]/gi, emailGoal)
      .replace(/\[thông tin thêm\]/gi, additionalInfo || 'Không có')
      .replace(/\[biên tài liệu\]/gi, documentContent);

    finalPrompt += `\n\n---
    QUAN TRỌNG: Vui lòng trả lời theo cấu trúc sau, sử dụng chính xác các đánh dấu này:
    **[TIÊU ĐỀ]**
    (Tiêu đề email của bạn ở đây)
    ---
    **[NỘI DUNG EMAIL]**
    (Toàn bộ nội dung email của bạn ở đây. Nội dung này PHẢI được định dạng bằng HTML. Sử dụng các thẻ như <p> cho đoạn văn, <b> cho in đậm, <ul> và <li> cho danh sách. KHÔNG sử dụng Markdown.)
    `;

    const result = await model.generateContent(finalPrompt);
    const rawGeneratedContent = result.response.text();

    if (!rawGeneratedContent || rawGeneratedContent.trim() === '') {
      throw new Error("AI không phản hồi nội dung. Vui lòng thử lại hoặc điều chỉnh yêu cầu.");
    }

    const subjectMatch = rawGeneratedContent.match(/\*\*\[TIÊU ĐỀ\]\*\*\s*([\s\S]*?)(?=\*\*\[NỘI DUNG EMAIL\]\*\*|---|$)/);
    const bodyMatch = rawGeneratedContent.match(/\*\*\[NỘI DUNG EMAIL\]\*\*\s*([\s\S]*)/);
    
    const subject = subjectMatch ? subjectMatch[1].trim() : 'Không tìm thấy tiêu đề';
    const body = bodyMatch ? bodyMatch[1].trim() : rawGeneratedContent;

    const { data: savedContent, error: saveError } = await supabaseAdmin
      .from('email_contents')
      .insert({
        user_id: user.id,
        name,
        service_id: serviceId,
        subject,
        body,
      })
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
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
})