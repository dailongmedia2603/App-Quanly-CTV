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

  // Remove markdown code block fences if they exist
  text = text.replace(/^```(markdown|md|)\s*\n/i, '');
  text = text.replace(/\n\s*```$/, '');

  const lines = text.split('\n');
  
  let firstContentLineIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();
    
    if (trimmedLine === '') {
      continue;
    }
    
    // If a line starts with markdown for a heading or bold, it's likely content
    if (trimmedLine.startsWith('#') || trimmedLine.startsWith('*')) {
      firstContentLineIndex = i;
      break;
    }
    
    // If a line is NOT a conversational preamble, it's likely content.
    const isPreamble = /^(chắc chắn rồi|dưới đây là|here is|tuyệt vời|tất nhiên|here's a draft|here's the post)/i.test(trimmedLine);
    if (!isPreamble) {
      firstContentLineIndex = i;
      break;
    }
  }

  if (firstContentLineIndex !== -1) {
    // If we found a content line, slice the array from that line onwards
    return lines.slice(firstContentLineIndex).join('\n').trim();
  }

  // Fallback to original text to avoid returning nothing.
  return rawText;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { service, postType, industry, direction, originalPost, regenerateDirection } = await req.json();

    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Không tìm thấy người dùng.");

    const { data: apiKeys, error: apiKeyError } = await supabase
        .from('user_api_keys')
        .select('gemini_api_key, gemini_model')
        .eq('user_id', user.id)
        .single();

    if (apiKeyError || !apiKeys?.gemini_api_key || !apiKeys?.gemini_model) {
        throw new Error("Chưa cấu hình API Key cho Gemini.");
    }

    const { data: templateData, error: templateError } = await supabase
        .from('ai_prompt_templates')
        .select('prompt')
        .eq('template_type', 'post')
        .single();

    if (templateError || !templateData?.prompt) {
        throw new Error("Không tìm thấy mẫu prompt cho việc tạo bài viết.");
    }

    let finalPrompt = templateData.prompt
        .replace(/\[dịch vụ\]/gi, service)
        .replace(/\[dạng bài\]/gi, postType)
        .replace(/\[ngành\]/gi, industry)
        .replace(/\[định hướng\]/gi, direction || 'Không có');

    if (regenerateDirection) {
        finalPrompt = `Dựa trên bài viết gốc sau:\n---\n${originalPost}\n---\nHãy tạo lại bài viết theo định hướng mới này: "${regenerateDirection}".\n\n${finalPrompt}`;
    }

    const genAI = new GoogleGenerativeAI(apiKeys.gemini_api_key);
    const model = genAI.getGenerativeModel({ model: apiKeys.gemini_model });

    const result = await model.generateContent(finalPrompt);
    const rawGeneratedText = result.response.text();
    
    const cleanedGeneratedText = cleanAiResponse(rawGeneratedText);

    // Log the generation event with the RAW text for debugging purposes
    const { error: logError } = await supabase.from('ai_generation_logs').insert({
        user_id: user.id,
        template_type: 'post',
        final_prompt: finalPrompt,
        generated_content: rawGeneratedText
    });

    if (logError) {
        console.error('Failed to log AI generation:', logError);
    }

    return new Response(JSON.stringify({ post: cleanedGeneratedText }), {
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