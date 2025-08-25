// @ts-nocheck

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Hàm trợ giúp để ghi lại lỗi vào bảng ai_error_logs
async function logError(supabaseAdmin: SupabaseClient, userId: string | null, error: Error, functionName: string, context: unknown) {
  try {
    const contextObject = typeof context === 'object' && context !== null ? context : { context };
    await supabaseAdmin.from('ai_error_logs').insert({
      user_id: userId,
      error_message: error.message,
      function_name: functionName,
      context: { ...contextObject, stack: error.stack },
    })
  } catch (logErr) {
    console.error('Failed to log error:', logErr)
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let userId: string | null = null
  let requestBody: unknown;
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // Xác thực người dùng từ token
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Xác thực người dùng thất bại.')
    }
    userId = user.id

    // Đọc và kiểm tra nội dung yêu cầu
    requestBody = await req.json()
    const { subject, serviceInfo, language } = requestBody as { subject: string; serviceInfo: string; language: string; };
    if (!subject || !serviceInfo || !language) {
      return new Response(JSON.stringify({ error: 'Thiếu thông tin cần thiết (chủ đề, dịch vụ, ngôn ngữ).' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // 1. Lấy API Key và model từ database
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('app_settings')
      .select('gemini_model')
      .eq('id', 1)
      .single();

    if (settingsError || !settings?.gemini_model) {
      throw new Error("Chưa cấu hình model cho Gemini trong cài đặt chung.");
    }

    const { data: apiKey, error: apiKeyError } = await supabaseAdmin.rpc('get_next_gemini_api_key')

    if (apiKeyError || !apiKey) {
      throw new Error(apiKeyError?.message ?? 'Không tìm thấy Gemini API Key. Vui lòng kiểm tra cấu hình hệ thống.')
    }

    // 2. Tạo nội dung bằng Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: settings.gemini_model })

    const prompt = `Viết một nội dung email marketing bằng tiếng ${language} với các thông tin sau:\n- Chủ đề: ${subject}\n- Thông tin dịch vụ: ${serviceInfo}\n\nNội dung cần chuyên nghiệp, hấp dẫn và kêu gọi hành động. Chỉ trả về phần nội dung email, không bao gồm tiêu đề hay các phần không liên quan.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return new Response(JSON.stringify({ content: text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    // Ghi lại lỗi và trả về thông báo lỗi rõ ràng
    await logError(supabaseAdmin, userId, error as Error, 'generate-email-content', requestBody)
    
    return new Response(JSON.stringify({ error: `Lỗi khi tạo nội dung: ${(error as Error).message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})