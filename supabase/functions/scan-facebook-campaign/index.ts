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

// Helper function to convert date to Unix timestamp
const toUnixTimestamp = (dateStr: string | null | undefined): number | null => {
  if (!dateStr) return null;
  return Math.floor(new Date(dateStr).getTime() / 1000);
};

// Helper function to format Unix timestamp for humans
const formatTimestampForHumans = (timestamp: number | null): string | null => {
    if (timestamp === null) return 'N/A';
    const date = new Date(timestamp * 1000); // Convert seconds to milliseconds
    const pad = (num: number) => num.toString().padStart(2, '0');
    
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1); // Month is 0-indexed
    const year = date.getFullYear();

    return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
};

// Helper to find keywords in content
const findKeywords = (content: string, keywords: string[]): string[] => {
    if (!content) return [];
    const found: string[] = [];
    const lowerContent = content.toLowerCase();
    for (const keyword of keywords) {
        if (lowerContent.includes(keyword.toLowerCase())) {
            found.push(keyword);
        }
    }
    return found;
};

const logScan = async (supabaseAdmin: any, campaign_id: string, status: string, message: string, details: any = null, log_type: 'progress' | 'final' = 'final') => {
    if (!campaign_id) return;
    await supabaseAdmin.from('scan_logs').insert({
        campaign_id,
        status,
        message,
        details,
        log_type,
        source_type: 'Facebook'
    });
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  let campaign_id_from_req: string | null = null;
  let sinceTimestamp: number | null = null;
  let untilTimestamp: number | null = null;

  try {
    const { campaign_id } = await req.json();
    campaign_id_from_req = campaign_id;

    if (!campaign_id) {
      throw new Error("Cần có ID chiến dịch.");
    }

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
        .select('*')
        .eq('user_id', campaignOwnerId)
        .single();

    if (apiKeyError) throw new Error(`Lấy API key cho người dùng ${campaignOwnerId} thất bại: ${apiKeyError.message}`);
    if (!apiKeys) throw new Error(`Người dùng ${campaignOwnerId} chưa cấu hình API key.`);

    if (campaign.type !== 'Facebook' && campaign.type !== 'Tổng hợp') {
        return new Response(JSON.stringify({ message: "Chức năng quét này chỉ dành cho các chiến dịch Facebook hoặc Tổng hợp." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    const facebookGroupIds = campaign.sources.filter((s: string) => !s.startsWith('http') && !s.startsWith('www'));
    if (facebookGroupIds.length === 0) {
        await logScan(supabaseAdmin, campaign.id, 'success', 'Chiến dịch không có nguồn Facebook nào để quét.', { sources: campaign.sources }, 'final');
        return new Response(JSON.stringify({ success: true, message: "Không có nguồn Facebook nào để quét." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    const {
        facebook_api_url,
        facebook_api_token,
        gemini_api_key,
        gemini_model
    } = apiKeys;

    if (!facebook_api_url || !facebook_api_token) {
        throw new Error("URL hoặc Token của API Facebook chưa được cấu hình trong cài đặt của người dùng.");
    }

    await logScan(supabaseAdmin, campaign.id, 'info', 'Bắt đầu quét nguồn Facebook...', null, 'progress');

    const reportTable = campaign.type === 'Tổng hợp' ? 'Bao_cao_tong_hop' : 'Bao_cao_Facebook';
    
    let latestPostQuery = supabaseAdmin
        .from(reportTable)
        .select('posted_at')
        .eq('campaign_id', campaign.id)
        .not('posted_at', 'is', null)
        .order('posted_at', { ascending: false })
        .limit(1);

    if (campaign.type === 'Tổng hợp') {
        latestPostQuery = latestPostQuery.eq('source_type', 'Facebook');
    }

    const { data: latestPostData, error: latestPostError } = await latestPostQuery.single();

    if (latestPostError && latestPostError.code !== 'PGRST116') {
        throw new Error(`Lỗi khi lấy bài viết cuối cùng: ${latestPostError.message}`);
    }

    const lastPostTime = latestPostData ? latestPostData.posted_at : null;
    sinceTimestamp = lastPostTime 
        ? toUnixTimestamp(lastPostTime)! + 1 
        : toUnixTimestamp(campaign.scan_start_date);
        
    untilTimestamp = Math.floor(Date.now() / 1000);

    const keywords = campaign.keywords ? campaign.keywords.split('\n').map(k => k.trim()).filter(k => k) : [];
    const allPostsData = [];
    const apiCallDetails = [];

    await logScan(supabaseAdmin, campaign.id, 'info', `(1/3) Đang lấy bài viết từ ${facebookGroupIds.length} group...`, null, 'progress');
    for (const groupId of facebookGroupIds) {
        let url = `${facebook_api_url.replace(/\/$/, '')}/${groupId}/feed?fields=message,created_time,id,permalink_url,from&access_token=${facebook_api_token}`;
        if (sinceTimestamp) {
            url += `&since=${sinceTimestamp}`;
        }
        url += `&until=${untilTimestamp}`;

        const fbResponse = await fetch(url);
        const responseText = await fbResponse.text();
        
        apiCallDetails.push({
            url,
            status: fbResponse.status,
            response: responseText.substring(0, 2000)
        });

        if (!fbResponse.ok) {
            console.error(`API server returned non-OK status for group ${groupId}: ${fbResponse.status} ${responseText}`);
            continue;
        }
        
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            console.error(`Failed to parse JSON response for group ${groupId}: ${e.message}`, responseText);
            continue;
        }

        // Handle both direct Facebook API response and proxy response
        let posts = [];
        if (responseData.data?.data) { // Proxy structure { success: true, data: { data: [...] } }
            posts = responseData.data.data;
        } else if (responseData.data) { // Direct Facebook API structure { data: [...] }
            posts = responseData.data;
        } else {
            const errorMessage = responseData.message || `API returned malformed data for group ${groupId}`;
            console.error(errorMessage, JSON.stringify(responseData));
            continue; // Skip to the next group
        }

        if (posts.length > 0) {
            allPostsData.push(...posts.map((post: any) => ({ ...post, campaign_id: campaign.id })));
        }
    }
    await logScan(supabaseAdmin, campaign.id, 'success', `(1/3) Đã lấy xong ${allPostsData.length} bài viết.`, null, 'progress');

    let filteredPosts = [];
    await logScan(supabaseAdmin, campaign.id, 'info', `(2/3) Đang lọc ${allPostsData.length} bài viết...`, null, 'progress');
    if (keywords.length > 0) {
        for (const post of allPostsData) {
            const foundKeywords = findKeywords(post.message, keywords);
            if (foundKeywords.length > 0) {
                filteredPosts.push({ ...post, keywords_found: foundKeywords });
            }
        }
    } else {
        filteredPosts = allPostsData.map(post => ({ ...post, keywords_found: [] }));
    }

    let finalResults = [];
    if (campaign.ai_filter_enabled && campaign.ai_prompt && gemini_api_key && gemini_model) {
        await logScan(supabaseAdmin, campaign.id, 'info', `(2/3) AI đang phân tích ${filteredPosts.length} bài viết...`, null, 'progress');
        const genAI = new GoogleGenerativeAI(gemini_api_key);
        const model = genAI.getGenerativeModel({ model: gemini_model });

        for (const post of filteredPosts) {
            const prompt = `
                ${campaign.ai_prompt}
                
                Analyze the following post content:
                "${post.message}"

                Based on my request, provide a JSON response with two keys:
                1. "evaluation": (string) Your evaluation based on my request.
                2. "sentiment": (string) The sentiment of the post, which must be one of: 'positive', 'negative', or 'neutral'.
                
                Your response must be a valid JSON object only.
            `;

            try {
                const result = await model.generateContent(prompt);
                const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                const aiResult = JSON.parse(responseText);
                
                finalResults.push({
                    campaign_id: campaign.id,
                    content: post.message,
                    posted_at: post.created_time,
                    source_url: post.permalink_url,
                    keywords_found: post.keywords_found,
                    ai_evaluation: aiResult.evaluation,
                    sentiment: aiResult.sentiment,
                });

            } catch (e) {
                console.error("Error processing with AI for post:", post.id, e);
                finalResults.push({
                    campaign_id: campaign.id,
                    content: post.message,
                    posted_at: post.created_time,
                    source_url: post.permalink_url,
                    keywords_found: post.keywords_found,
                    ai_evaluation: 'Xử lý bằng AI thất bại.',
                    sentiment: null,
                });
            }
        }
    } else {
        finalResults = filteredPosts.map(post => ({
            campaign_id: campaign.id,
            content: post.message,
            posted_at: post.created_time,
            source_url: post.permalink_url,
            keywords_found: post.keywords_found,
            ai_evaluation: null,
            sentiment: null,
        }));
    }
    await logScan(supabaseAdmin, campaign.id, 'success', `(2/3) Phân tích và lọc xong.`, null, 'progress');

    if (finalResults.length > 0) {
        await logScan(supabaseAdmin, campaign.id, 'info', `(3/3) Đang lưu ${finalResults.length} kết quả vào báo cáo...`, null, 'progress');
        const dataToInsert = campaign.type === 'Tổng hợp' 
            ? finalResults.map(r => {
                const { content, ...rest } = r;
                return { ...rest, description: content, source_type: 'Facebook' };
            })
            : finalResults;

        const { error: insertError } = await supabaseAdmin
            .from(reportTable)
            .insert(dataToInsert);

        if (insertError) {
            await logScan(supabaseAdmin, campaign.id, 'error', `(3/3) Lưu kết quả thất bại.`, null, 'final');
            throw new Error(`Thêm dữ liệu báo cáo thất bại: ${insertError.message}`);
        }
        await logScan(supabaseAdmin, campaign.id, 'success', `(3/3) Đã lưu ${finalResults.length} kết quả.`, null, 'progress');
    }
    
    const successMessage = `Quét Facebook hoàn tất. Đã tìm thấy và xử lý ${finalResults.length} bài viết.`;
    await logScan(supabaseAdmin, campaign_id_from_req, 'success', successMessage, { 
        since: sinceTimestamp,
        "since (readable)": formatTimestampForHumans(sinceTimestamp),
        until: untilTimestamp,
        "until (readable)": formatTimestampForHumans(untilTimestamp),
        api_calls: apiCallDetails, 
        found_posts: finalResults.length,
    }, 'final');

    return new Response(JSON.stringify({ success: true, message: successMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(error);
    await logScan(supabaseAdmin, campaign_id_from_req, 'error', error.message, { 
        stack: error.stack,
        since: sinceTimestamp,
        "since (readable)": formatTimestampForHumans(sinceTimestamp),
        until: untilTimestamp,
        "until (readable)": formatTimestampForHumans(untilTimestamp),
    }, 'final');
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
});