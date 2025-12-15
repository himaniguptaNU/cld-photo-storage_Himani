import { serverSupabaseUser } from '#supabase/server';
import { createClient } from '@supabase/supabase-js';

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event);

    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized - No user found'
      });
    }

    console.log('GetUsers - User:', user.email);
    console.log('GetUsers - Role:', user.user_metadata?.role);

    const userRole = user.user_metadata?.role || 'basic';
    
    if (userRole !== 'admin') {
      throw createError({
        statusCode: 403,
        message: 'Admin access required'
      });
    }

    const config = useRuntimeConfig();
    
    console.log('GetUsers - Creating admin client...');
    console.log('GetUsers - URL:', config.public.supabase.url);
    console.log('GetUsers - Has service key:', !!config.supabase.serviceKey);

    const supabaseAdmin = createClient(
      config.public.supabase.url,
      config.supabase.serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('GetUsers - Fetching users...');
    
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error('GetUsers - Error listing users:', error);
      throw error;
    }

    console.log('GetUsers - Found users:', data.users.length);

    const users = data.users.map(u => ({
      id: u.id,
      email: u.email || '',
      role: u.user_metadata?.role || 'basic',
      banned: u.banned_until ? new Date(u.banned_until) > new Date() : false,
      created_at: u.created_at
    }));

    console.log('GetUsers - Returning users:', users.length);

    return users;
  } catch (error: any) {
    console.error('GetUsers - Fatal error:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch users'
    });
  }
});