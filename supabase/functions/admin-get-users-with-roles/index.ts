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

    // 1. Get all users
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
    });
    if (usersError) throw usersError;

    // 2. Get all available roles with permissions
    const { data: allRoles, error: rolesError } = await supabaseAdmin
      .from('roles')
      .select('id, name, description, permissions');
    if (rolesError) throw rolesError;

    // 3. Get all user-role assignments
    const { data: userRoles, error: userRolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role_id');
    if (userRolesError) throw userRolesError;

    // 4. Map roles to users
    const usersWithRoles = users.map(user => {
      const assignedRoleIds = userRoles
        .filter(ur => ur.user_id === user.id)
        .map(ur => ur.role_id);
      
      const assignedRoleNames = allRoles
        .filter(role => assignedRoleIds.includes(role.id))
        .map(role => role.name);

      return {
        ...user,
        roles: assignedRoleNames,
      };
    });

    return new Response(JSON.stringify({ users: usersWithRoles, allRoles }), {
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