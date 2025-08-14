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

const logScan = async (supabaseAdmin: any, campaign_id: string, user_id: string, status: string, message: string, details: any = null, log_type: 'progress' | 'final' = 'final') => {
    if (!campaign_id || !user_id) return;
    await supabaseAdmin.from('scan_logs').insert({
        campaign_id,
        user_id,
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
  let user_id_from_req: string | null = null;
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
    user_id_from_req = campaignOwnerId;
    if (!campaignOwnerId) throw new Error("Chiến dịch không có người sở hữu.");

    const { data: apiKeys, error: apiKeyError } = await supabaseAdmin
        .from('app_settings')
        .select('facebook_api_url, facebook_api_token, gemini_model')
        .eq('id', 1)
        .single();

    if (apiKeyError) throw new Error(`Lấy API key chung thất bại: ${apiKeyError.message}`);
    if (!apiKeys) throw new Error(`Chưa cấu hình API key trong cài đặt chung.`);

    if (campaign.type !== 'Facebook' && campaign.type !== 'Tổng hợp') {
        return new Response(JSON.stringify({ message: "Chức năng quét này chỉ dành cho các chiến dịch Facebook hoặc Tổng hợp." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    const facebookGroupIds = campaign.sources.filter((s: string) => !s.startsWith('http') && !s.startsWith('www'));
    if (facebookGroupIds.length === 0) {
        await logScan(supabaseAdmin, campaign.id, campaignOwnerId, 'success', 'Chiến dịch không có nguồn Facebook nào để quét.', { sources: campaign.sources }, 'final');
        return new Response(JSON.stringify({ success: true, message: "Không có nguồn Facebook nào để quét." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    const {
        facebook_api_url,
        facebook_api_token,
        gemini_model
    } = apiKeys;

    if (!facebook_api_url || !facebook_api_token) {
        throw new Error("URL hoặc Token của API Facebook chưa được cấu hình trong cài đặt chung.");
    }

    await logScan(supabaseAdmin, campaign.id, campaignOwnerId, 'info', 'Bắt đầu quét nguồn Facebook...', null, 'progress');

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

    await logScan(supabaseAdmin, campaign.id, campaignOwnerId, 'info', `(1/4) Đang lấy bài viết từ ${facebookGroupIds.length} group...`, null, 'progress');
    for (const groupId of facebookGroupIds) {
        let url = `${facebook_api_url.replace(/\/$/, '')}/${groupId}/feed?fields=message,created_time,id,permalink_url,from&access_token=${facebook_api_token}&limit=100`;
        if (sinceTimestamp) {
            url += `&since=${sinceTimestamp}`;
        }
        url += `&until=${untilTimestamp}`;

        const fbResponse = await fetch(url);
        const responseText = await fbResponse.text();
        
        let responseData;
        let posts = [];
        let apiCallLog = {
            url,
            status: fbResponse.status,
            response: {
                posts_received: 0,
                has_next_page: false,
                error_message: null as string | null,
                raw_preview: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : '')
            }
        };

        try {
            responseData = JSON.parse(responseText);
            if (responseData.data?.data) {
                posts = responseData.data.data;
            } else if (responseData.data) {
                posts = responseData.data;
            }
            apiCallLog.response.posts_received = posts.length;
            apiCallLog.response.has_next_page = !!(responseData.data?.paging?.next || responseData.paging?.next);
            if (responseData.error) {
                apiCallLog.response.error_message = responseData.error.message;
            }
        } catch (e) {
            apiCallLog.response.error_message = `Failed to parse JSON: ${e.message}`;
            console.error(`Failed to parse JSON response for group ${groupId}: ${e.message}`, responseText);
        }
        
        apiCallDetails.push(apiCallLog);

        if (posts.length > 0) {
            allPostsData.push(...posts.map((post: any) => ({ ...post, campaign_id: campaign.id })));
        }
    }
    await logScan(supabaseAdmin, campaign.id, campaignOwnerId, 'success', `(1/4) Đã lấy xong ${allPostsData.length} bài viết.`, null, 'progress');

    let newPostsData = allPostsData;
    if (allPostsData.length > 0) {
        const postIdsFromApi = allPostsData.map(p => p.id);
        
        let existingPostsQuery = supabaseAdmin
            .from(reportTable)
            .select('source_post_id')
            .eq('campaign_id', campaign.id)
            .in('source_post_id', postIdsFromApi);

        if (campaign.type === 'Tổng hợp') {
            existingPostsQuery = existingPostsQuery.eq('source_type', 'Facebook');
        }

        const { data: existingPosts, error: existingPostsError } = await existingPostsQuery;

        if (existingPostsError) {
            throw new Error(`Lỗi khi kiểm tra bài viết đã tồn tại: ${existingPostsError.message}`);
        }

        const existingPostIds = new Set(existingPosts.map(p => p.source_post_id));
        newPostsData = allPostsData.filter(p => !existingPostIds.has(p.id));
    }

    let filteredPosts = [];
    await logScan(supabaseAdmin, campaign.id, campaignOwnerId, 'info', `(2/4) Đang lọc ${newPostsData.length} bài viết mới...`, null, 'progress');
    if (keywords.length > 0) {
        for (const post of newPostsData) {
            const foundKeywords = findKeywords(post.message, keywords);
            if (foundKeywords.length > 0) {
                filteredPosts.push({ ...post, keywords_found: foundKeywords });
            }
        }
    } else {
        filteredPosts = newPostsData.map(post => ({ ...post, keywords_found: [] }));
    }

    let finalResults = [];
    if (campaign.ai_filter_enabled && campaign.ai_prompt && gemini_model) {
        await logScan(supabaseAdmin, campaign.id, campaignOwnerId, 'info', `(2/4) AI đang phân tích ${filteredPosts.length} bài viết...`, null, 'progress');
        
        for (const post of filteredPosts) {
            const { data: geminiApiKey, error: apiKeyError } = await supabaseAdmin.rpc('get_next_gemini_api_key');
            if (apiKeyError || !geminiApiKey) {
                console.error("Could not retrieve a valid Gemini API key for post:", post.id);
                continue;
            }
            const genAI = new GoogleGenerativeAI(geminiApiKey);
            const model = genAI.getGenerativeModel({ model: gemini_model });

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
                    source_post_id: post.id,
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
                    source_post_id: post.id,
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
            source_post_id: post.id,
        }));
    }
    await logScan(supabaseAdmin, campaign.id, campaignOwnerId, 'success', `(2/4) Phân tích và lọc xong.`, null, 'progress');

    await logScan(supabaseAdmin, campaign.id, campaignOwnerId, 'info', `(3/4) AI đang tạo comment đề xuất cho ${finalResults.length} bài viết...`, null, 'progress');
    const commentGenerationPromises = finalResults.map(async (post) => {
        if (!gemini_model || !post.content) {
            return { ...post, suggested_comment: null };
        }
        
        const { data: geminiApiKey, error: apiKeyError } = await supabaseAdmin.rpc('get_next_gemini_api_key');
        if (apiKeyError || !geminiApiKey) {
            console.error("Could not retrieve a valid Gemini API key for comment generation on post:", post.source_url);
            return { ...post, suggested_comment: 'AI comment generation failed due to API key issue.' };
        }

        const prompt = `
            You are a helpful and professional marketing assistant. 
            Based on the following Facebook post, write a short, friendly, and natural-sounding comment to introduce a relevant service.
            The service we offer is related to these keywords: "${post.keywords_found?.join(', ')}".
            The comment should be engaging and encourage a response. Do not use hashtags.

            Post Content:
            ---
            ${post.content}
            ---

            Your response must be a single string containing only the suggested comment in Vietnamese.
        `;

        try {
            const genAI = new GoogleGenerativeAI(geminiApiKey);
            const model = genAI.getGenerativeModel({ model: gemini_model });
            const result = await model.generateContent(prompt);
            const comment = result.response.text().trim();
            return { ...post, suggested_comment: comment };
        } catch (e) {
            console.error("Error generating suggested comment for post:", post.source_url, e);
            return { ...post, suggested_comment: 'AI comment generation failed.' };
        }
    });

    const resultsWithComments = await Promise.all(commentGenerationPromises);

    if (resultsWithComments.length > 0) {
        await logScan(supabaseAdmin, campaign.id, campaignOwnerId, 'info', `(4/4) Đang lưu ${resultsWithComments.length} kết quả vào báo cáo...`, null, 'progress');
        const dataToInsert = campaign.type === 'Tổng hợp' 
            ? resultsWithComments.map(r => {
                const { content, ...rest } = r;
                return { ...rest, description: content, source_type: 'Facebook' };
            })
            : resultsWithComments;

        const { error: insertError } = await supabaseAdmin
            .from(reportTable)
            .insert(dataToInsert);

        if (insertError) {
            await logScan(supabaseAdmin, campaign.id, campaignOwnerId, 'error', `(4/4) Lưu kết quả thất bại.`, null, 'final');
            throw new Error(`Thêm dữ liệu báo cáo thất bại: ${insertError.message}`);
        }
        await logScan(supabaseAdmin, campaign.id, campaignOwnerId, 'success', `(4/4) Đã lưu ${resultsWithComments.length} kết quả.`, null, 'progress');
    }
    
    const successMessage = `Quét Facebook hoàn tất. Đã tìm thấy và xử lý ${resultsWithComments.length} bài viết mới.`;
    await logScan(supabaseAdmin, campaign_id_from_req, user_id_from_req, 'success', successMessage, { 
        since: sinceTimestamp,
        "since (readable)": formatTimestampForHumans(sinceTimestamp),
        until: untilTimestamp,
        "until (readable)": formatTimestampForHumans(untilTimestamp),
        api_calls: apiCallDetails, 
        found_posts: resultsWithComments.length,
    }, 'final');

    return new Response(JSON.stringify({ success: true, message: successMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(error);
    await logScan(supabaseAdmin, campaign_id_from_req, user_id_from_req, 'error', error.message, { 
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