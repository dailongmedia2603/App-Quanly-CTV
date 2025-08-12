// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { template_type } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: logs, error: logsError } = await supabaseAdmin
      .from('ai_generation_logs')
      .select('*')
      .eq('template_type', template_type)
      .eq('is_hidden_in_admin_history', false) // Only get logs that are not hidden
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (logsError) throw logsError;

    const userIds = [...new Set(logs.map(log => log.user_id).filter(Boolean))];
    let userMap = new Map();

    if (userIds.length > 0) {
        const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 1000,
        });
        if (usersError) throw usersError;
        userMap = new Map(users.filter(u => userIds.includes(u.id)).map(u => [u.id, u.email]));
    }

    const logsWithEmails = logs.map(log => ({
      ...log,
      user_email: userMap.get(log.user_id) || 'Unknown User'
    }));

    return new Response(JSON.stringify(logsWithEmails), {
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