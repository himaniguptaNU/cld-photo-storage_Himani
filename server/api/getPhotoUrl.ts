
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { createClient } from '@supabase/supabase-js';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);

  if (!user || !user.sub) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    });
  }

  const userId = user.sub;

  const query = getQuery(event);
  let filePath = query.path as string;

  if (!filePath) {
    const body = await readBody(event);
    filePath = body.filePath;
  }

  if (!filePath) {
    throw createError({
      statusCode: 400,
      message: 'File path is required'
    });
  }

  try {
    const userRole = user.user_metadata?.role || 'basic';
    
    const fileUserId = filePath.split('/')[0];
    
    if (userRole !== 'admin' && fileUserId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'Access denied'
      });
    }

    const config = useRuntimeConfig();
    const supabaseAdmin = createClient(
      config.public.supabase.url,
      config.supabase.serviceKey
    );

    const { data, error } = await supabaseAdmin
      .storage
      .from('user-photos')
      .createSignedUrl(filePath, 3600);

    if (error) {
      console.error('Storage error:', error);
      throw error;
    }

    if (!data || !data.signedUrl) {
      throw new Error('Failed to generate signed URL');
    }

    return {
      url: data.signedUrl
    };
  } catch (error: any) {
    console.error('Error getting photo URL:', error);
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to get photo URL'
    });
  }
});