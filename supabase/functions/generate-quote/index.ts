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

const safetyInstruction = "Bạn là một trợ lý AI chuyên nghiệp, hữu ích và an toàn. Hãy tập trung vào việc tạo ra nội dung marketing chất lượng cao, phù hợp với ngữ cảnh được cung cấp. TUYỆT ĐỐI TRÁNH các chủ đề nhạy cảm, gây tranh cãi, hoặc có thể bị hiểu lầm là tiêu cực. Luôn duy trì một thái độ tích cực và chuyên nghiệp.\n\n---\n\n";

const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const cleanAndParseAiResponse = (rawText: string): any => {
  if (!rawText) throw new Error("AI không trả về nội dung.");
  
  let text = rawText.trim();
  
  const jsonStartIndex = text.indexOf('{');
  if (jsonStartIndex === -1) throw new Error("Phản hồi của AI không chứa đối tượng JSON hợp lệ.");
  
  const jsonEndIndex = text.lastIndexOf('}');
  if (jsonEndIndex === -1) throw new Error("Phản hồi của AI không chứa đối tượng JSON hợp lệ.");

  const jsonString = text.substring(jsonStartIndex, jsonEndIndex + 1);

  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Lỗi phân tích JSON từ AI:", jsonString);
    throw new Error(`AI trả về JSON không hợp lệ: ${e.message}`);
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { name, budget, serviceIds, includesVat, otherRequirements, implementationTime } = await req.json();
    if (!budget || !serviceIds || serviceIds.length === 0) {
      throw new Error("Cần có ngân sách và ít nhất một dịch vụ được chọn.");
    }

    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Không tìm thấy người dùng.");

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    
    const { data: settings, error: settingsError } = await supabaseAdmin.from('app_settings').select('gemini_model').eq('id', 1).single();
    if (settingsError || !settings?.gemini_model) throw new Error("Chưa cấu hình model Gemini.");

    const [pricesRes, templatesRes, promptTemplateRes] = await Promise.all([
      supabaseAdmin.from('service_prices').select('name, description, unit, price, category'),
      supabaseAdmin.from('quote_templates').select('name, content').in('service_id', serviceIds),
      supabaseAdmin.from('ai_prompt_templates').select('prompt').eq('template_type', 'quote').single()
    ]);

    const { data: servicePrices, error: pricesError } = pricesRes;
    if (pricesError || !servicePrices) throw new Error("Không thể tải bảng giá dịch vụ.");

    const { data: quoteTemplates, error: templatesError } = templatesRes;
    if (templatesError) console.error("Lỗi tải mẫu báo giá:", templatesError.message);

    const { data: promptTemplateData, error: promptTemplateError } = promptTemplateRes;
    if (promptTemplateError || !promptTemplateData?.prompt) {
      throw new Error("Không tìm thấy mẫu prompt cho việc tạo báo giá. Vui lòng cấu hình trong Cài đặt.");
    }

    const servicePricesText = servicePrices.map(p => `- ${p.name} (${p.category || 'N/A'}): ${p.price.toLocaleString('vi-VN')} VNĐ/${p.unit || 'lần'}. Mô tả: ${p.description || 'Không có'}`).join('\n');
    const quoteTemplatesText = quoteTemplates && quoteTemplates.length > 0
      ? quoteTemplates.map(t => `--- MẪU: ${t.name} ---\n${t.content}`).join('\n\n')
      : "Không có mẫu báo giá tham khảo.";

    const prompt = safetyInstruction + promptTemplateData.prompt
      .replace(/\[budget\]/gi, budget.toLocaleString('vi-VN'))
      .replace(/\[vat_info\]/gi, includesVat ? "Báo giá CÓ bao gồm 8% VAT." : "Báo giá KHÔNG bao gồm VAT.")
      .replace(/\[thời gian triển khai\]/gi, implementationTime || "Chưa xác định")
      .replace(/\[other_requirements\]/gi, otherRequirements || "Không có.")
      .replace(/\[service_prices\]/gi, servicePricesText)
      .replace(/\[quote_templates\]/gi, quoteTemplatesText);

    const { data: geminiApiKey, error: apiKeyError } = await supabaseAdmin.rpc('get_next_gemini_api_key');
    if (apiKeyError || !geminiApiKey) throw new Error("Không thể lấy Gemini API Key.");

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: settings.gemini_model });

    const result = await model.generateContent(prompt);
    const rawGeneratedContent = result.response.text();
    const generatedJson = cleanAndParseAiResponse(rawGeneratedContent);

    if (!generatedJson || !generatedJson.summary || typeof generatedJson.summary.total === 'undefined') {
        throw new Error("Phản hồi của AI thiếu các trường bắt buộc (summary.total).");
    }

    const finalPrice = generatedJson.summary.total;
    const generatedContentString = JSON.stringify(generatedJson);

    const { data: savedQuote, error: saveError } = await supabaseAdmin
      .from('generated_quotes')
      .insert({
        user_id: user.id,
        name: name || `Báo giá ngày ${formatDate(new Date())}`,
        budget,
        service_ids: serviceIds,
        includes_vat: includesVat,
        other_requirements: otherRequirements,
        implementation_time: implementationTime,
        generated_content: generatedContentString,
        final_price: finalPrice,
      })
      .select()
      .single();

    if (saveError) throw new Error(`Lưu báo giá thất bại: ${saveError.message}`);

    return new Response(JSON.stringify(savedQuote), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

  } catch (error) {
    console.error('Lỗi Edge function:', error);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
})