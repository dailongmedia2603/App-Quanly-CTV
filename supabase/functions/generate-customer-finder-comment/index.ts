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
      if (trimmedLine.startsWith('#') || trimmedLine.startsWith('*')) {
        firstContentLineIndex = i;
        break;
      }
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
    const { reportId, postContent } = await req.json();
    if (!reportId || !postContent) {
      throw new Error("Yêu cầu ID báo cáo và nội dung bài đăng.");
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

    // 1. Get API Key and Model
    const { data: geminiApiKey, error: apiKeyError } = await supabaseAdmin.rpc('get_next_gemini_api_key');
    if (apiKeyError || !geminiApiKey) throw new Error("Không thể lấy Gemini API Key.");
    
    const { data: settings, error: settingsError } = await supabaseAdmin.from('app_settings').select('gemini_model').eq('id', 1).single();
    if (settingsError || !settings?.gemini_model) throw new Error("Chưa cấu hình model Gemini.");

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: settings.gemini_model });

    // 2. Get all services to identify the most relevant one
    const { data: services, error: servicesError } = await supabaseAdmin
      .from('document_services')
      .select('id, name, description');
    if (servicesError || !services || services.length === 0) {
      throw new Error("Không tìm thấy dịch vụ nào để đối chiếu.");
    }

    // 3. AI Call 1: Identify the service
    const serviceListForPrompt = services.map(s => `ID: ${s.id}\nTên dịch vụ: ${s.name}\nMô tả: ${s.description || 'Không có'}`).join('\n---\n');
    const serviceIdentificationPrompt = `
      Bạn là một chuyên gia phân tích. Dựa vào nội dung bài viết sau, hãy xác định dịch vụ phù hợp nhất từ danh sách dưới đây.
      Chỉ trả về ID (UUID) của dịch vụ phù hợp nhất, không thêm bất kỳ văn bản nào khác.

      NỘI DUNG BÀI VIẾT:
      """
      ${postContent}
      """

      DANH SÁCH DỊCH VỤ:
      """
      ${serviceListForPrompt}
      """

      ID DỊCH VỤ PHÙ HỢP NHẤT:
    `;

    const serviceIdResult = await model.generateContent(serviceIdentificationPrompt);
    const identifiedServiceId = serviceIdResult.response.text().trim();

    const matchedService = services.find(s => s.id === identifiedServiceId);
    if (!matchedService) {
      throw new Error("AI không thể xác định được dịch vụ phù hợp.");
    }

    // 4. Get documents for the identified service
    const serviceForPrompt = `${matchedService.name}${matchedService.description ? ` (Mô tả: ${matchedService.description})` : ''}`;
    let documentContent = "Không có tài liệu tham khảo.";
    const { data: documents, error: documentsError } = await supabaseAdmin
        .from('documents')
        .select('title, ai_prompt, content')
        .eq('service_id', matchedService.id);
    
    if (!documentsError && documents && documents.length > 0) {
        documentContent = documents
            .map(doc => `Tên tài liệu: ${doc.title}\nYêu cầu AI khi đọc: ${doc.ai_prompt || 'Không có'}\nNội dung chi tiết:\n${doc.content || 'Không có'}`)
            .join('\n\n---\n\n');
    }

    // 5. Get comment prompt template
    const { data: templateData, error: templateError } = await supabase
        .from('ai_prompt_templates')
        .select('prompt')
        .eq('template_type', 'comment')
        .single();
    if (templateError || !templateData?.prompt) {
        throw new Error("Không tìm thấy mẫu prompt cho 'comment'.");
    }

    // 6. AI Call 2: Generate the comment
    const diversityInstruction = `
      LƯU Ý QUAN TRỌNG: Để đảm bảo mỗi comment là duy nhất, hãy thêm vào một yếu tố ngẫu nhiên và sáng tạo. Ví dụ: bắt đầu bằng một lời chào khác lạ, đặt một câu hỏi tinh tế liên quan đến chi tiết trong bài viết, hoặc sử dụng một giọng văn hơi khác biệt (ví dụ: chuyên nghiệp, thân thiện, hài hước nhẹ nhàng). Tuyệt đối không lặp lại comment đã tạo trước đó cho cùng một bài viết.
    `;

    let finalPrompt = templateData.prompt
        .replace(/\[dịch vụ\]/gi, serviceForPrompt)
        .replace(/\[nội dung gốc\]/gi, postContent)
        .replace(/\[biên tài liệu\]/gi, documentContent);
    
    finalPrompt = diversityInstruction + '\n\n' + finalPrompt;
    
    finalPrompt += `\n\n---
    QUAN TRỌNG: Vui lòng trả lời theo cấu trúc sau, sử dụng chính xác các đánh dấu này:
    **[NỘI DUNG COMMENT]**
    (Toàn bộ nội dung comment của bạn ở đây, sẵn sàng để sao chép và sử dụng)
    `;

    const commentResult = await model.generateContent(finalPrompt);
    const rawGeneratedText = commentResult.response.text();
    const cleanedGeneratedComment = cleanAiResponse(rawGeneratedText);

    if (!cleanedGeneratedComment) {
        throw new Error("AI không tạo được comment hợp lệ.");
    }

    // 7. Save the comment and identified service to the database
    const { error: updateError } = await supabaseAdmin
      .from('"Bao_cao_tong_hop"')
      .update({ 
        suggested_comment: cleanedGeneratedComment,
        identified_service_id: matchedService.id 
      })
      .eq('id', reportId);

    if (updateError) {
      throw new Error(`Lưu comment thất bại: ${updateError.message}`);
    }

    // 8. Log the generation
    await supabaseAdmin.from('ai_generation_logs').insert({
        user_id: user.id,
        template_type: 'customer_finder_comment',
        final_prompt: finalPrompt,
        generated_content: rawGeneratedText,
        is_hidden_in_admin_history: true
    });

    // 9. Return the comment
    return new Response(JSON.stringify({ comment: cleanedGeneratedComment, service: matchedService }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Lỗi Edge function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})