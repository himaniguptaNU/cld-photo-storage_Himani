import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { createClient } from '@supabase/supabase-js';

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event);
  const user = await serverSupabaseUser(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    });
  }

  const userRole = user.user_metadata?.role || 'basic';
  
  if (userRole !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'Admin access required'
    });
  }

  const body = await readBody(event);
  const { userId, role } = body;

  if (!userId || !role) {
    throw createError({
      statusCode: 400,
      message: 'User ID and role are required'
    });
  }

  if (role !== 'basic' && role !== 'admin') {
    throw createError({
      statusCode: 400,
      message: 'Invalid role'
    });
  }

  try {
    const config = useRuntimeConfig();
    const supabaseAdmin = createClient(
      config.public.supabase.url,
      config.supabase.serviceKey
    );
    
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        user_metadata: { role }
      }
    );

    if (error) {
      throw error;
    }

    return {
      success: true
    };
  } catch (error: any) {
    console.error('Error updating role:', error);
    return {
      success: false,
      error: error.message || 'Failed to update user role'
    };
  }
});