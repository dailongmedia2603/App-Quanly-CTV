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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if the user is a Super Admin
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");

    const { data: userRoles, error: rolesError } = await supabase.rpc('get_user_roles');
    if (rolesError) throw rolesError;
    
    const isSuperAdmin = userRoles.some((r: { role_name: string }) => r.role_name === 'Super Admin');
    if (!isSuperAdmin) {
      throw new Error("Only Super Admins can view action logs.");
    }

    // Fetch logs
    const { data: logs, error: logsError } = await supabaseAdmin
      .from('manual_action_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (logsError) throw logsError;

    // Fetch user emails to enrich logs
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