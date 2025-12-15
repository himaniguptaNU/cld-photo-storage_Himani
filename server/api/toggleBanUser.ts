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
  const { userId, banned } = body;

  if (!userId) {
    throw createError({
      statusCode: 400,
      message: 'User ID is required'
    });
  }

  try {
    const config = useRuntimeConfig();
    const supabaseAdmin = createClient(
      config.public.supabase.url,
      config.supabase.serviceKey
    );
    
    if (banned) {
      const banDuration = '876000h';
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { ban_duration: banDuration }
      );

      if (error) {
        throw error;
      }
    } else {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { ban_duration: 'none' }
      );

      if (error) {
        throw error;
      }
    }

    return {
      success: true
    };
  } catch (error: any) {
    console.error('Error toggling ban:', error);
    return {
      success: false,
      error: error.message || 'Failed to update user'
    };
  }
});