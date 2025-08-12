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

const logScan = async (supabaseAdmin: any, campaign_id: string, status: string, message: string, details: any = null, log_type: 'progress' | 'final' = 'final') => {
    if (!campaign_id) return;
    await supabaseAdmin.from('scan_logs').insert({
        campaign_id,
        status,
        message,
        details,
        log_type,
        source_type: 'Website'
    });
};

// Main function handler
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  let campaign_id_from_req: string | null = null;

  try {
    const { campaign_id } = await req.json();
    campaign_id_from_req = campaign_id;

    if (!campaign_id) {
      throw new Error("Cần có ID chiến dịch.");
    }

    await logScan(supabaseAdmin, campaign_id, 'info', '(1/4) Bắt đầu quét website: Đang lấy cấu hình...', null, 'progress');

    const { data: campaign, error: campaignError } = await supabaseAdmin
        .from('danh_sach_chien_dich')
        .select('*')
        .eq('id', campaign_id)
        .single();

    if (campaignError) throw new Error(`Lấy chiến dịch thất bại: ${campaignError.message}`);
    if (!campaign) throw new Error("Không tìm thấy chiến dịch.");

    const campaignOwnerId = campaign.user_id;
    if (!campaignOwnerId) throw new Error("Chiến dịch không có người sở hữu.");

    const { data: apiKeys, error: apiKeyError } = await supabaseAdmin
        .from('user_api_keys')
        .select('firecrawl_api_key, gemini_api_key, gemini_model')
        .eq('user_id', campaignOwnerId)
        .single();

    if (apiKeyError) throw new Error(`Lấy API key cho người dùng ${campaignOwnerId} thất bại: ${apiKeyError.message}`);
    if (!apiKeys) throw new Error(`Người dùng ${campaignOwnerId} chưa cấu hình API key.`);

    const { firecrawl_api_key, gemini_api_key, gemini_model } = apiKeys;
    
    if (!firecrawl_api_key) throw new Error("API Key của Firecrawl chưa được cấu hình.");
    if (!gemini_api_key || !gemini_model) throw new Error("API Key hoặc Model của Gemini chưa được cấu hình.");

    const websiteUrls = campaign.sources.filter((s: string) => s.startsWith('http') || s.startsWith('www'));
    if (websiteUrls.length === 0) {
        await logScan(supabaseAdmin, campaign_id, 'success', 'Hoàn tất: Chiến dịch không có nguồn website nào để quét.', null, 'final');
        return new Response(JSON.stringify({ success: true, message: "Không có nguồn website nào để quét." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }
    
    await logScan(supabaseAdmin, campaign_id, 'info', `(2/4) Đang thu thập dữ liệu từ ${websiteUrls.length} website...`, null, 'progress');

    const firecrawlPromises = websiteUrls.map(async (url: string) => {
        const firecrawlUrl = `https://api.firecrawl.dev/v0${campaign.website_scan_type || '/scrape'}`;
        const body = { url, pageOptions: { onlyMainContent: true } };
        try {
            const response = await fetch(firecrawlUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${firecrawl_api_key}` },
                body: JSON.stringify(body),
            });
            const responseData = await response.json();
            if (!response.ok || !responseData.success) {
                throw new Error(responseData.error || 'Unknown Firecrawl error');
            }
            return { success: true, url, data: responseData.data };
        } catch (error) {
            return { success: false, url, error: error.message };
        }
    });

    const firecrawlResults = await Promise.all(firecrawlPromises);
    const successfulCrawls = firecrawlResults.filter(r => r.success);
    const failedCrawls = firecrawlResults.filter(r => !r.success);

    if (failedCrawls.length > 0) {
        await logScan(supabaseAdmin, campaign_id, 'error', `Thu thập dữ liệu thất bại cho ${failedCrawls.length} website.`, { failedUrls: failedCrawls }, 'progress');
    }
    if (successfulCrawls.length === 0) {
        throw new Error("Không thể thu thập dữ liệu từ bất kỳ website nào.");
    }

    await logScan(supabaseAdmin, campaign_id, 'info', `(3/4) AI đang phân tích nội dung từ ${successfulCrawls.length} website...`, null, 'progress');
    
    const genAI = new GoogleGenerativeAI(gemini_api_key);
    const aiModel = genAI.getGenerativeModel({ model: gemini_model });

    const analysisPromises = successfulCrawls.map(async (crawl) => {
        const rawContent = crawl.data.markdown || crawl.data.content;
        if (!rawContent) {
            return { success: false, url: crawl.url, error: "No content from Firecrawl" };
        }
        const prompt = `
            You are an expert data extraction agent. Analyze the provided Markdown content from a webpage and identify all individual posts or listings.
            For each listing you find, extract the following information:
            - title: The main title of the listing.
            - description: A short summary of the listing content.
            - price: The price, including currency or unit (e.g., "1.5 tỷ", "15 triệu/tháng").
            - area: The area or size, including units (e.g., "50 m²").
            - address: The address or general location of the property.
            - listing_url: The direct URL to the specific listing if available, otherwise use the main page URL.
            - posted_date_string: The relative date text as it appears on the page (e.g., "Hôm nay", "Đăng 3 ngày trước").

            Return the result as a JSON array of objects. Each object represents one listing.
            If a specific field is not found for a listing, use null for its value.
            Your response MUST be only a valid JSON array, without any other text or markdown formatting.

            Here is the Markdown content to analyze:
            ---
            ${rawContent.substring(0, 30000)}
            ---
        `;
        try {
            const result = await aiModel.generateContent(prompt);
            const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            const extractedData = JSON.parse(responseText);
            return { success: true, url: crawl.url, data: extractedData };
        } catch (error) {
            return { success: false, url: crawl.url, error: error.message };
        }
    });

    const analysisResults = await Promise.all(analysisPromises);
    const successfulAnalyses = analysisResults.filter(r => r.success);
    const failedAnalyses = analysisResults.filter(r => !r.success);

    if (failedAnalyses.length > 0) {
        await logScan(supabaseAdmin, campaign_id, 'error', `Phân tích AI thất bại cho ${failedAnalyses.length} website.`, { failedUrls: failedAnalyses }, 'progress');
    }

    const allExtractedListings = successfulAnalyses.flatMap(analysis => {
        if (!Array.isArray(analysis.data)) return [];
        return analysis.data.map(item => ({
            campaign_id: campaign.id,
            title: item.title || null,
            description: item.description || null,
            price: item.price || null,
            area: item.area || null,
            address: item.address || null,
            listing_url: item.listing_url || analysis.url,
            posted_date_string: item.posted_date_string || null,
            source_url: analysis.url,
            ...(campaign.type === 'Tổng hợp' && { source_type: 'Website' })
        }));
    });

    if (allExtractedListings.length > 0) {
        await logScan(supabaseAdmin, campaign_id, 'info', `(4/4) Đang lưu ${allExtractedListings.length} kết quả vào báo cáo...`, null, 'progress');
        const reportTable = campaign.type === 'Tổng hợp' ? 'Bao_cao_tong_hop' : 'Bao_cao_Website';
        const { error: insertError } = await supabaseAdmin.from(reportTable).insert(allExtractedListings);

        if (insertError) {
            throw new Error(`Thêm dữ liệu báo cáo thất bại: ${insertError.message}`);
        }
    }
    
    const successMessage = `Quét Website hoàn tất. Đã xử lý ${websiteUrls.length} URL và trích xuất được ${allExtractedListings.length} tin đăng.`;
    await logScan(supabaseAdmin, campaign_id, 'success', successMessage, { found_items: allExtractedListings.length }, 'final');

    return new Response(JSON.stringify({ success: true, message: successMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(error);
    await logScan(supabaseAdmin, campaign_id_from_req, 'error', error.message, { stack: error.stack }, 'final');
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
});