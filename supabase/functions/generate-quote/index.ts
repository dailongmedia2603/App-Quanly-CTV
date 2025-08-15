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
    const { name, budget, serviceIds, includesVat, otherRequirements } = await req.json();
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
    const [pricesRes, templatesRes] = await Promise.all([
      supabaseAdmin.from('service_prices').select('name, description, unit, price, category'),
      supabaseAdmin.from('quote_templates').select('name, content').in('service_id', serviceIds)
    ]);

    const { data: servicePrices, error: pricesError } = pricesRes;
    if (pricesError || !servicePrices) throw new Error("Không thể tải bảng giá dịch vụ.");

    const { data: quoteTemplates, error: templatesError } = templatesRes;
    if (templatesError) console.error("Lỗi tải mẫu báo giá:", templatesError.message);

    const servicePricesText = servicePrices.map(p => `- ${p.name} (${p.category || 'N/A'}): ${p.price.toLocaleString('vi-VN')} VNĐ/${p.unit || 'lần'}. Mô tả: ${p.description || 'Không có'}`).join('\n');
    const quoteTemplatesText = quoteTemplates && quoteTemplates.length > 0
      ? quoteTemplates.map(t => `--- MẪU: ${t.name} ---\n${t.content}`).join('\n\n')
      : "Không có mẫu báo giá tham khảo.";

    const prompt = `
      Bạn là một chuyên gia kinh doanh và tạo báo giá chuyên nghiệp.
      Nhiệm vụ của bạn là tạo một báo giá chi tiết, hấp dẫn và tối ưu cho khách hàng dựa trên các thông tin sau:

      1.  **Ngân sách của khách hàng:** ${budget.toLocaleString('vi-VN')} VNĐ. Cố gắng tạo báo giá có tổng tiền gần với ngân sách này nhất có thể, có thể cao hơn hoặc thấp hơn một chút nhưng không quá 10%.
      2.  **Dịch vụ khách hàng quan tâm:** (Dựa trên ID đã chọn, AI sẽ tự phân tích từ bảng giá)
      3.  **Thuế:** ${includesVat ? "Báo giá CÓ bao gồm 10% VAT." : "Báo giá KHÔNG bao gồm VAT."}
      4.  **Yêu cầu khác từ khách hàng:** ${otherRequirements || "Không có."}

      **DỮ LIỆU THAM KHẢO:**

      **A. Bảng giá dịch vụ chi tiết:**
      ${servicePricesText}

      **B. Các mẫu báo giá đã làm trước đây (để tham khảo văn phong và cấu trúc):**
      ${quoteTemplatesText}

      **YÊU CẦU ĐẦU RA:**
      Hãy tạo ra một báo giá hoàn chỉnh bằng định dạng Markdown. Báo giá phải bao gồm các phần sau:
      -   Tiêu đề: "BÁO GIÁ DỊCH VỤ"
      -   Thông tin cơ bản: Ngày báo giá, Mã báo giá (tự tạo).
      -   Bảng chi tiết các hạng mục dịch vụ. Bảng này PHẢI có các cột: "Hạng mục", "Mô tả chi tiết", "Số lượng", "Đơn vị", "Đơn giá (VNĐ)", "Thành tiền (VNĐ)".
      -   Phần tổng kết chi phí:
          -   Cộng dịch vụ (VNĐ)
          -   Thuế VAT (10% nếu có)
          -   **TỔNG CỘNG (VNĐ)**
      -   Ghi chú (nếu cần).

      **QUAN TRỌNG:**
      -   Hãy lựa chọn các dịch vụ và số lượng phù hợp nhất từ Bảng giá để tối ưu trong ngân sách khách hàng đưa ra.
      -   Phần "Mô tả chi tiết" phải giải thích rõ ràng giá trị và lợi ích của từng hạng mục.
      -   Tất cả các con số phải được định dạng có dấu chấm ngăn cách hàng nghìn (ví dụ: 1.000.000).
      -   Giữ văn phong chuyên nghiệp, thuyết phục.
    `;

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