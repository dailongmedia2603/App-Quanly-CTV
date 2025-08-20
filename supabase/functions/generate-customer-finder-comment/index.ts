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
  text = text.replace(/^```(json|markdown|md|)\s*\n/i, '');
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
  const functionName = 'generate-customer-finder-comment';
  let requestBody: any = {};

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Không tìm thấy người dùng.");
    userId = user.id;

    requestBody = await req.json();
    const { reportId, postContent } = requestBody;
    if (!reportId || !postContent) throw new Error("Yêu cầu ID báo cáo và nội dung bài đăng.");

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    const { data: geminiApiKey, error: apiKeyError } = await supabaseAdmin.rpc('get_next_gemini_api_key');
    if (apiKeyError || !geminiApiKey) throw new Error("Không thể lấy Gemini API Key.");
    
    const { data: settings, error: settingsError } = await supabaseAdmin.from('app_settings').select('gemini_model').eq('id', 1).single();
    if (settingsError || !settings?.gemini_model) throw new Error("Chưa cấu hình model Gemini.");

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: settings.gemini_model });

    // Step 1: Fetch all services and the master prompt template
    const [servicesRes, templateRes] = await Promise.all([
        supabaseAdmin.from('document_services').select('id, name, description'),
        supabaseAdmin.from('ai_prompt_templates').select('prompt').eq('template_type', 'customer_finder_comment').single()
    ]);

    const { data: services, error: servicesError } = servicesRes;
    if (servicesError || !services || services.length === 0) throw new Error("Không tìm thấy dịch vụ nào để đối chiếu.");

    const { data: templateData, error: templateError } = templateRes;
    if (templateError || !templateData?.prompt) {
        throw new Error("Không tìm thấy mẫu prompt cho 'Tìm khách hàng'. Vui lòng tạo một mẫu trong Cấu hình > Content AI.");
    }

    // Step 2: Construct the dynamic parts of the prompt
    const { data: documents } = await supabaseAdmin.from('documents').select('title, content, service_id');
    const documentsByService = (documents || []).reduce((acc: any, doc: any) => {
        if (!acc[doc.service_id]) acc[doc.service_id] = [];
        acc[doc.service_id].push(`Tài liệu: ${doc.title}\nNội dung: ${doc.content}`);
        return acc;
    }, {});

    const serviceAndDocsPrompt = services.map(s => {
        const serviceDocs = documentsByService[s.id] ? documentsByService[s.id].join('\n\n') : 'Không có tài liệu tham khảo.';
        return `ID: ${s.id}\nTên dịch vụ: ${s.name}\nMô tả: ${s.description || 'Không có'}\n${serviceDocs}`;
    }).join('\n---\n');

    // Step 3: Assemble the final prompt by replacing variables in the master template
    const finalPrompt = templateData.prompt
        .replace(/\[nội dung gốc\]/gi, postContent)
        .replace(/\[danh sách dịch vụ và tài liệu\]/gi, serviceAndDocsPrompt);

    // Step 4: Call AI
    const result = await model.generateContent(finalPrompt);
    const rawResponse = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    
    let aiResult;
    try {
        aiResult = JSON.parse(rawResponse);
    } catch (e) {
        console.error("Failed to parse AI JSON response:", rawResponse);
        throw new Error("AI đã trả về một định dạng không hợp lệ.");
    }

    const { service_id: identifiedServiceId, comment: generatedComment } = aiResult;
    const cleanedGeneratedComment = cleanAiResponse(generatedComment);

    if (!identifiedServiceId || !cleanedGeneratedComment || !services.some(s => s.id === identifiedServiceId)) {
        throw new Error("AI không thể xác định dịch vụ hoặc tạo comment hợp lệ.");
    }
    
    const matchedService = services.find(s => s.id === identifiedServiceId);

    // Step 5: Delete any existing comment for this user/report, then insert the new one.
    await supabaseAdmin
      .from('user_suggested_comments')
      .delete()
      .match({ user_id: user.id, report_id: reportId });

    const { error: insertError } = await supabaseAdmin
      .from('user_suggested_comments')
      .insert({
        user_id: user.id,
        report_id: reportId,
        comment_text: cleanedGeneratedComment,
      });

    if (insertError) throw new Error(`Lưu comment thất bại: ${insertError.message}`);

    // Also update the globally identified service on the main report
    await supabaseAdmin
        .from('Bao_cao_Facebook')
        .update({ identified_service_id: identifiedServiceId })
        .eq('id', reportId);

    // Step 6: Log and return
    await supabaseAdmin.from('ai_generation_logs').insert({ user_id: user.id, template_type: 'customer_finder_comment', final_prompt: finalPrompt, generated_content: rawResponse, is_hidden_in_admin_history: false });

    return new Response(JSON.stringify({ comment: cleanedGeneratedComment, service: matchedService }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

  } catch (error) {
    console.error(`Error in ${functionName}:`, error);
    if (userId) {
      const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
      await logErrorToDb(supabaseAdmin, userId, functionName, error, requestBody);
    }
    return new Response(JSON.stringify({ error: "Đang bị quá tải.... Hãy bấm tạo lại nhé" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
})