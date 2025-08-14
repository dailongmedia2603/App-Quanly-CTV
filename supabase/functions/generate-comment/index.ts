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

// --- Các yếu tố tạo sự đa dạng cho comment ---
const TONES = ['thân thiện và gần gũi', 'chuyên nghiệp và am hiểu', 'ngắn gọn và tò mò', 'hài hước và thông minh', 'đồng cảm và chia sẻ'];
const ANGLES = ['đặt một câu hỏi liên quan để gợi chuyện', 'chia sẻ một mẹo nhỏ hữu ích liên quan đến chủ đề', 'khen ngợi một điểm cụ thể trong bài viết gốc', 'tạo ra một sự liên tưởng thú vị đến dịch vụ', 'đưa ra một góc nhìn bổ sung cho bài viết'];

const getRandomItem = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { originalPostContent } = await req.json();
    if (!originalPostContent) throw new Error("Original post content is required.");

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

    // --- Step 1: Lấy API Key và Model ---
    const { data: geminiApiKey, error: apiKeyError } = await supabaseAdmin.rpc('get_next_gemini_api_key');
    if (apiKeyError || !geminiApiKey) throw new Error("Chưa cấu hình hoặc không thể lấy Gemini API Key.");

    const { data: settings, error: settingsError } = await supabaseAdmin.from('app_settings').select('gemini_model').eq('id', 1).single();
    if (settingsError || !settings?.gemini_model) throw new Error("Chưa cấu hình model cho Gemini trong cài đặt chung.");

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: settings.gemini_model });

    // --- Step 2: Tự động nhận diện dịch vụ liên quan nhất ---
    const { data: services, error: servicesError } = await supabaseAdmin.from('document_services').select('id, name, description');
    if (servicesError || !services || services.length === 0) throw new Error("Không có dịch vụ nào được cấu hình.");

    const serviceListForPrompt = services.map(s => `- ${s.name}: ${s.description || 'Không có mô tả'}`).join('\n');
    const serviceDetectionPrompt = `Dựa vào nội dung bài viết sau đây, hãy cho biết dịch vụ nào là phù hợp nhất để bình luận quảng bá. Chỉ trả về TÊN CHÍNH XÁC của dịch vụ từ danh sách được cung cấp.\n\nNỘI DUNG BÀI VIẾT:\n"${originalPostContent}"\n\nDANH SÁCH DỊCH VỤ:\n${serviceListForPrompt}\n\nTRẢ LỜI (chỉ tên dịch vụ):`;
    
    const detectionResult = await model.generateContent(serviceDetectionPrompt);
    const detectedServiceName = detectionResult.response.text().trim();
    const detectedService = services.find(s => s.name === detectedServiceName);

    if (!detectedService) throw new Error("AI không thể xác định được dịch vụ phù hợp cho bài viết này.");

    // --- Step 3: Lấy tài liệu và mẫu prompt cho dịch vụ đã nhận diện ---
    const { data: templateData, error: templateError } = await supabase.from('ai_prompt_templates').select('prompt').eq('template_type', 'comment').single();
    if (templateError || !templateData?.prompt) throw new Error("Không tìm thấy mẫu prompt cho việc tạo comment.");

    let documentContent = "Không có tài liệu tham khảo.";
    const { data: documents } = await supabase.from('documents').select('title, content').eq('service_id', detectedService.id);
    if (documents && documents.length > 0) {
        documentContent = documents.map(doc => `Tài liệu: ${doc.title}\nNội dung: ${doc.content}`).join('\n\n---\n\n');
    }

    // --- Step 4: Tạo prompt cuối cùng với yếu tố đa dạng ---
    const randomTone = getRandomItem(TONES);
    const randomAngle = getRandomItem(ANGLES);
    const serviceForPrompt = `${detectedService.name}${detectedService.description ? ` (Mô tả: ${detectedService.description})` : ''}`;

    let finalPrompt = templateData.prompt
        .replace(/\[dịch vụ\]/gi, serviceForPrompt)
        .replace(/\[nội dung gốc\]/gi, originalPostContent)
        .replace(/\[biên tài liệu\]/gi, documentContent);
    
    finalPrompt += `\n\nYÊU CẦU BỔ SUNG: Hãy viết comment với giọng văn **${randomTone}** và theo hướng **${randomAngle}**.`;

    // --- Step 5: Gọi AI để tạo comment và trả về ---
    const generationResult = await model.generateContent(finalPrompt);
    const generatedComment = generationResult.response.text().trim();

    await supabase.from('ai_generation_logs').insert({
        user_id: user.id,
        template_type: 'comment',
        final_prompt: finalPrompt,
        generated_content: generatedComment
    });

    return new Response(JSON.stringify({ comment: generatedComment }), {
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