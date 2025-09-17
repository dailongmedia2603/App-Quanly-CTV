// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const safetyInstruction = "Bạn là một trợ lý AI chuyên nghiệp, hữu ích và an toàn. Hãy tập trung vào việc tạo ra nội dung marketing chất lượng cao, phù hợp với ngữ cảnh được cung cấp. TUYỆT ĐỐI TRÁNH các chủ đề nhạy cảm, gây tranh cãi, hoặc có thể bị hiểu lầm là tiêu cực. Luôn duy trì một thái độ tích cực và chuyên nghiệp.\n\n---\n\n";

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

const callMultiAppAI = async (prompt: string, settings: any) => {
  const { ai_model_name, multiappai_api_url, multiappai_api_key } = settings;
  if (!ai_model_name || !multiappai_api_url || !multiappai_api_key) {
    throw new Error("MultiApp AI URL, Key, or Model Name is not configured in settings.");
  }

  const response = await fetch(`${multiappai_api_url.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${multiappai_api_key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: ai_model_name,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      response_format: { type: "json_object" },
    }),
  });

  const responseData = await response.json();

  if (!response.ok) {
    const errorMessage = responseData.error?.message || `AI API error: ${response.status}`;
    throw new Error(errorMessage);
  }

  const content = responseData.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI did not return any content.");
  }

  return content;
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

    const { data: settings, error: settingsError } = await supabaseAdmin
        .from('app_settings')
        .select('facebook_api_url, facebook_api_token, ai_model_name, multiappai_api_url, multiappai_api_key')
        .eq('id', 1)
        .single();

    if (settingsError) throw new Error(`Lấy API key chung thất bại: ${settingsError.message}`);
    if (!settings) throw new Error(`Chưa cấu hình API key trong cài đặt chung.`);

    if (campaign.type !== 'Facebook') {
        return new Response(JSON.stringify({ message: "Chức năng quét này chỉ dành cho các chiến dịch Facebook." }), {
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

    const { facebook_api_url, facebook_api_token } = settings;

    if (!facebook_api_url || !facebook_api_token) {
        throw new Error("URL hoặc Token của API Facebook chưa được cấu hình trong cài đặt chung.");
    }

    await logScan(supabaseAdmin, campaign.id, campaignOwnerId, 'info', 'Bắt đầu quét nguồn Facebook...', null, 'progress');

    const reportTable = 'Bao_cao_Facebook';
    
    const { data: latestPostsData, error: latestPostError } = await supabaseAdmin
        .from(reportTable)
        .select('posted_at')
        .eq('campaign_id', campaign.id)
        .not('posted_at', 'is', null)
        .order('posted_at', { ascending: false })
        .limit(1);

    if (latestPostError) {
        throw new Error(`Lỗi khi lấy bài viết cuối cùng: ${latestPostError.message}`);
    }

    const lastPostTime = (latestPostsData && latestPostsData.length > 0) ? latestPostsData[0].posted_at : null;
    const campaignStartTime = campaign.scan_start_date;

    let effectiveStartTimeStr: string | null = null;

    if (lastPostTime && campaignStartTime) {
        effectiveStartTimeStr = new Date(lastPostTime) > new Date(campaignStartTime) ? lastPostTime : campaignStartTime;
    } else {
        effectiveStartTimeStr = lastPostTime || campaignStartTime;
    }

    if (effectiveStartTimeStr) {
        if (effectiveStartTimeStr === lastPostTime) {
            sinceTimestamp = toUnixTimestamp(effectiveStartTimeStr)! + 1;
        } else {
            sinceTimestamp = toUnixTimestamp(effectiveStartTimeStr);
        }
    } else {
        sinceTimestamp = null;
    }
        
    untilTimestamp = Math.floor(Date.now() / 1000);

    const allPostsData = [];
    const apiCallDetails = [];

    await logScan(supabaseAdmin, campaign.id, campaignOwnerId, 'info', `(1/3) Đang lấy bài viết từ ${facebookGroupIds.length} group...`, null, 'progress');
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
    await logScan(supabaseAdmin, campaign.id, campaignOwnerId, 'success', `(1/3) Đã lấy xong ${allPostsData.length} bài viết.`, null, 'progress');

    let newPostsData = allPostsData;
    if (allPostsData.length > 0) {
        const postIdsFromApi = allPostsData.map(p => p.id);
        const existingPostIds = new Set<string>();
        const CHUNK_SIZE = 200;

        for (let i = 0; i < postIdsFromApi.length; i += CHUNK_SIZE) {
            const chunk = postIdsFromApi.slice(i, i + CHUNK_SIZE);
            const { data: existingPostsChunk, error: chunkError } = await supabaseAdmin
                .from(reportTable)
                .select('source_post_id')
                .eq('campaign_id', campaign.id)
                .in('source_post_id', chunk);

            if (chunkError) {
                throw new Error(`Lỗi khi kiểm tra bài viết đã tồn tại: ${chunkError.message}`);
            }

            if (existingPostsChunk) {
                for (const post of existingPostsChunk) {
                    existingPostIds.add(post.source_post_id);
                }
            }
        }
        
        newPostsData = allPostsData.filter(p => !existingPostIds.has(p.id));
    }

    await logScan(supabaseAdmin, campaign.id, campaignOwnerId, 'info', `(2/3) Đã tìm thấy ${newPostsData.length} bài viết mới. Bắt đầu lọc...`, null, 'progress');
    
    let filteredPosts = [];
    const keywords = campaign.keywords ? campaign.keywords.split('\n').map(k => k.trim()).filter(k => k) : [];
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
    if (campaign.ai_filter_enabled && campaign.ai_prompt) {
        await logScan(supabaseAdmin, campaign.id, campaignOwnerId, 'info', `(2/3) AI đang phân tích ${filteredPosts.length} bài viết...`, null, 'progress');
        
        for (const post of filteredPosts) {
            const prompt = safetyInstruction + `
                ${campaign.ai_prompt}
                
                Analyze the following post content:
                "${post.message}"

                Based on my request, provide a JSON response with two keys:
                1. "evaluation": (string) Your evaluation based on my request.
                2. "sentiment": (string) The sentiment of the post, which must be one of: 'positive', 'negative', or 'neutral'.
                
                Your response must be a valid JSON object only.
            `;

            try {
                const rawResponse = await callMultiAppAI(prompt, settings);
                const responseText = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
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
    await logScan(supabaseAdmin, campaign.id, campaignOwnerId, 'success', `(2/3) Phân tích và lọc xong.`, null, 'progress');

    if (finalResults.length > 0) {
        await logScan(supabaseAdmin, campaign.id, campaignOwnerId, 'info', `(3/3) Đang lưu ${finalResults.length} kết quả vào báo cáo...`, null, 'progress');
        
        const { error: insertError } = await supabaseAdmin
            .from(reportTable)
            .insert(finalResults);

        if (insertError) {
            await logScan(supabaseAdmin, campaign.id, campaignOwnerId, 'error', `(3/3) Lưu kết quả thất bại.`, null, 'final');
            throw new Error(`Thêm dữ liệu báo cáo thất bại: ${insertError.message}`);
        }
        await logScan(supabaseAdmin, campaign.id, campaignOwnerId, 'success', `(3/3) Đã lưu ${finalResults.length} kết quả.`, null, 'progress');
    }
    
    const successMessage = `Quét Facebook hoàn tất. Đã tìm thấy và xử lý ${finalResults.length} bài viết mới.`;
    await logScan(supabaseAdmin, campaign_id_from_req, user_id_from_req, 'success', successMessage, { 
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