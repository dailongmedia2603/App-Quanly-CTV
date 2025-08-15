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
    if (!reportId || !postContent) throw new Error("Yêu cầu ID báo cáo và nội dung bài đăng.");

    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Không tìm thấy người dùng.");

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    const { data: geminiApiKey, error: apiKeyError } = await supabaseAdmin.rpc('get_next_gemini_api_key');
    if (apiKeyError || !geminiApiKey) throw new Error("Không thể lấy Gemini API Key.");
    
    const { data: settings, error: settingsError } = await supabaseAdmin.from('app_settings').select('gemini_model').eq('id', 1).single();
    if (settingsError || !settings?.gemini_model) throw new Error("Chưa cấu hình model Gemini.");

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: settings.gemini_model });

    // Step 1: Get pre-identified service ID from the database
    const { data: reportData, error: reportError } = await supabaseAdmin
        .from('Bao_cao_Facebook')
        .select('identified_service_id')
        .eq('id', reportId)
        .single();

    if (reportError) throw new Error(`Không tìm thấy báo cáo với ID: ${reportId}. Lỗi: ${reportError.message}`);
    
    let serviceId = reportData.identified_service_id;
    let matchedService;

    // Fallback: If service ID is missing (for old data), identify it now.
    if (!serviceId) {
        console.warn(`Service ID not found for report ${reportId}. Running identification on-the-fly.`);
        const { data: services, error: servicesError } = await supabaseAdmin.from('document_services').select('id, name, description');
        if (servicesError || !services || services.length === 0) throw new Error("Không tìm thấy dịch vụ nào để đối chiếu.");

        const serviceListForPrompt = services.map(s => `ID: ${s.id}\nTên dịch vụ: ${s.name}\nMô tả: ${s.description || 'Không có'}`).join('\n---\n');
        const serviceIdentificationPrompt = `Dựa vào nội dung bài viết sau, hãy xác định dịch vụ phù hợp nhất từ danh sách. Chỉ trả về ID của dịch vụ.\n\nBÀI VIẾT:\n"""${postContent}"""\n\nDANH SÁCH DỊCH VỤ:\n"""${serviceListForPrompt}"""\n\nID DỊCH VỤ PHÙ HỢP NHẤT:`;
        
        const serviceIdResult = await model.generateContent(serviceIdentificationPrompt);
        const rawServiceIdResponse = serviceIdResult.response.text().trim();
        
        const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
        const match = rawServiceIdResponse.match(uuidRegex);
        const foundServiceId = match ? match[0] : null;

        matchedService = services.find(s => s.id === foundServiceId);
        if (!matchedService) {
            console.error(`AI failed to identify a valid service. Raw response: "${rawServiceIdResponse}"`);
            throw new Error("AI không thể xác định được dịch vụ phù hợp.");
        }
        serviceId = matchedService.id;
    } else {
        const { data, error } = await supabaseAdmin.from('document_services').select('*').eq('id', serviceId).single();
        if (error) throw new Error(`Lỗi khi lấy dịch vụ đã xác định: ${error.message}`);
        matchedService = data;
    }

    if (!matchedService) throw new Error("Không thể xác định dịch vụ để tạo comment.");

    // Step 2: Generate Comment
    const { data: documents } = await supabaseAdmin.from('documents').select('title, ai_prompt, content').eq('service_id', matchedService.id);
    const documentContent = (documents && documents.length > 0) ? documents.map(doc => `Tên tài liệu: ${doc.title}\nYêu cầu AI khi đọc: ${doc.ai_prompt || 'Không có'}\nNội dung chi tiết:\n${doc.content || 'Không có'}`).join('\n\n---\n\n') : "Không có tài liệu tham khảo.";

    const { data: templateData } = await supabase.from('ai_prompt_templates').select('prompt').eq('template_type', 'comment').single();
    if (!templateData?.prompt) throw new Error("Không tìm thấy mẫu prompt cho 'comment'.");

    const diversityInstruction = `LƯU Ý QUAN TRỌNG: Để đảm bảo mỗi comment là duy nhất, hãy thêm vào một yếu tố ngẫu nhiên và sáng tạo. Ví dụ: bắt đầu bằng một lời chào khác lạ, đặt một câu hỏi tinh tế liên quan đến chi tiết trong bài viết, hoặc sử dụng một giọng văn hơi khác biệt (ví dụ: chuyên nghiệp, thân thiện, hài hước nhẹ nhàng). Tuyệt đối không lặp lại comment đã tạo trước đó cho cùng một bài viết.`;
    let finalPrompt = `${diversityInstruction}\n\n${templateData.prompt}`
        .replace(/\[dịch vụ\]/gi, `${matchedService.name}${matchedService.description ? ` (Mô tả: ${matchedService.description})` : ''}`)
        .replace(/\[nội dung gốc\]/gi, postContent)
        .replace(/\[biên tài liệu\]/gi, documentContent);
    finalPrompt += `\n\n---\nQUAN TRỌNG: Trả lời theo cấu trúc sau:\n**[NỘI DUNG COMMENT]**\n(Nội dung comment của bạn ở đây)`;

    const commentResult = await model.generateContent(finalPrompt);
    const rawGeneratedText = commentResult.response.text();
    const cleanedGeneratedComment = cleanAiResponse(rawGeneratedText);
    if (!cleanedGeneratedComment) throw new Error("AI không tạo được comment hợp lệ.");

    // Step 3: Save the result
    const { error: updateError } = await supabaseAdmin.from('Bao_cao_Facebook').update({ suggested_comment: cleanedGeneratedComment, identified_service_id: serviceId }).eq('id', reportId);
    if (updateError) throw new Error(`Lưu comment thất bại: ${updateError.message}`);

    await supabaseAdmin.from('ai_generation_logs').insert({ user_id: user.id, template_type: 'customer_finder_comment', final_prompt: finalPrompt, generated_content: rawGeneratedText, is_hidden_in_admin_history: true });

    return new Response(JSON.stringify({ comment: cleanedGeneratedComment, service: matchedService }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (error) {
    console.error('Lỗi Edge function:', error);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
})