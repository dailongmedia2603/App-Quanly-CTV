// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
// @ts-ignore
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.15.0";
// @ts-ignore
import { marked } from 'https://esm.sh/marked@4.3.0';

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

    const contactInfo = `
      <p>
        <b>VUA SEEDING - TRUYỀN THÔNG ĐIỀU HƯỚNG CỘNG ĐỒNG</b><br>
        Hotline: ${phoneNumber || 'Chưa cung cấp'}<br>
        Website: Vuaseeding.top
      </p>
    `;

    let finalPrompt = templateRes.data.prompt
      .replace(/\[dịch vụ\]/gi, serviceForPrompt)
      .replace(/\[mục tiêu\]/gi, emailGoal)
      .replace(/\[thông tin thêm\]/gi, additionalInfo || 'Không có')
      .replace(/\[biên tài liệu\]/gi, documentContent)
      .replace(/\[thông tin liên hệ\]/gi, contactInfo)
      .replace(/\[link_cta\]/gi, ctaLink || 'https://vuaseeding.top/lien-he');

    finalPrompt += `\n\n---
    QUAN TRỌNG: Vui lòng trả lời theo cấu trúc sau, sử dụng chính xác các đánh dấu này:
    **[TIÊU ĐỀ]**
    (Tiêu đề email của bạn ở đây)
    ---
    **[NỘI DUNG EMAIL]**
    (Toàn bộ nội dung email của bạn ở đây. Nội dung này PHẢI được định dạng bằng Markdown đơn giản. Sử dụng các cú pháp như **để in đậm**, * để in nghiêng, và - cho danh sách.)
    `;

    const MAX_RETRIES = 3;
    let lastError: Error | null = null;
    let rawGeneratedContent = '';

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
            rawGeneratedContent = responseText;
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

    const subjectMatch = rawGeneratedContent.match(/\*\*\[TIÊU ĐỀ\]\*\*\s*([\s\S]*?)(?=\*\*\[NỘI DUNG EMAIL\]\*\*|---|$)/);
    const bodyMatch = rawGeneratedContent.match(/\*\*\[NỘI DUNG EMAIL\]\*\*\s*([\s\S]*)/);
    
    if (!subjectMatch || !bodyMatch) {
      console.error("Invalid AI response format. Raw response:", rawGeneratedContent);
      throw new Error("AI đã trả về định dạng không hợp lệ. Vui lòng thử lại hoặc điều chỉnh prompt trong Cấu hình.");
    }

    const subject = subjectMatch[1].trim();
    const markdownBody = bodyMatch[1].trim();
    let body = marked.parse(markdownBody);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const trackingPixelUrl = `${supabaseUrl}/functions/v1/track-email-open?log_id=%%LOG_ID%%`;
    const trackingPixelImg = `<img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:none;"/>`;

    body += trackingPixelImg;

    const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"/g;
    body = body.replace(linkRegex, (match, originalUrl) => {
      if (originalUrl.startsWith('http')) {
        const encodedUrl = encodeURIComponent(originalUrl);
        const trackingUrl = `${supabaseUrl}/functions/v1/track-email-click?log_id=%%LOG_ID%%&redirect_url=${encodedUrl}`;
        return match.replace(originalUrl, trackingUrl);
      }
      return match;
    });

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