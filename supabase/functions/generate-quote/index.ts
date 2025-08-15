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

const parseFormattedNumber = (value: string) => {
  return Number(String(value).replace(/\./g, '').replace(/,/g, ''));
};

const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const cleanAiResponse = (rawText: string): string => {
  if (!rawText) return '';
  let text = rawText.trim();
  // Remove markdown code block fences that Gemini often adds
  text = text.replace(/^```(markdown|md|)\s*\n/i, '');
  text = text.replace(/\n\s*```$/, '');
  return text.trim();
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

    const { data: geminiApiKey, error: apiKeyError } = await supabaseAdmin.rpc('get_next_gemini_api_key');
    if (apiKeyError || !geminiApiKey) throw new Error("Không thể lấy Gemini API Key.");
    
    const { data: settings, error: settingsError } = await supabaseAdmin.from('app_settings').select('gemini_model').eq('id', 1).single();
    if (settingsError || !settings?.gemini_model) throw new Error("Chưa cấu hình model Gemini.");

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: settings.gemini_model });

    // Fetch all necessary data in parallel
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

    const prompt = promptTemplateData.prompt
      .replace(/\[budget\]/gi, budget.toLocaleString('vi-VN'))
      .replace(/\[vat_info\]/gi, includesVat ? "Báo giá CÓ bao gồm 8% VAT." : "Báo giá KHÔNG bao gồm VAT.")
      .replace(/\[thời gian triển khai\]/gi, implementationTime || "Chưa xác định")
      .replace(/\[other_requirements\]/gi, otherRequirements || "Không có.")
      .replace(/\[service_prices\]/gi, servicePricesText)
      .replace(/\[quote_templates\]/gi, quoteTemplatesText);

    const result = await model.generateContent(prompt);
    const rawGeneratedContent = result.response.text();
    const generatedContent = cleanAiResponse(rawGeneratedContent);

    if (!generatedContent) {
        throw new Error("AI không thể tạo nội dung báo giá. Vui lòng thử lại.");
    }

    // Extract final price from the cleaned content for storage
    const totalMatch = generatedContent.match(/TỔNG CỘNG \(VNĐ\)\*\*:\s*([\d.,]+)/);
    const finalPrice = totalMatch ? parseFormattedNumber(totalMatch[1]) : null;

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
        generated_content: generatedContent,
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