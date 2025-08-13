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
      throw new Error("Only Super Admins can update roles.");
    }

    // Proceed with updating the role
    const { role_id, description, permissions } = await req.json();
    if (!role_id) {
        throw new Error("Role ID is required.");
    }

    const updates: { description?: string; permissions?: any } = {};
    if (description !== undefined) updates.description = description;
    if (permissions !== undefined) updates.permissions = permissions;

    if (Object.keys(updates).length === 0) {
        throw new Error("No updates provided.");
    }

    const { data, error } = await supabaseAdmin
      .from('roles')
      .update(updates)
      .eq('id', role_id)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})