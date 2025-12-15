import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { createClient } from '@supabase/supabase-js';

export default defineEventHandler(async (event) => {
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
  const { email, password, role } = body;

  if (!email || !password) {
    return {
      success: false,
      error: 'Email and password are required'
    };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: 'Invalid email format'
    };
  }

  // Validate password length
  if (password.length < 6) {
    return {
      success: false,
      error: 'Password must be at least 6 characters'
    };
  }

  try {
    const config = useRuntimeConfig();
    const supabaseAdmin = createClient(
      config.public.supabase.url,
      config.supabase.serviceKey
    );

    // Check if user with this email already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(u => u.email === email);

    if (emailExists) {
      return {
        success: false,
        error: 'A user with this email already exists'
      };
    }
    
    // Create the user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        role: role || 'basic'
      }
    });

    if (error) {
      console.error('Error creating user:', error);
      
      // Handle specific error cases
      if (error.message.includes('duplicate') || error.message.includes('already exists')) {
        return {
          success: false,
          error: 'A user with this email already exists'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to create user'
      };
    }

    console.log('User created successfully:', data.user?.email);

    return {
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        role: data.user?.user_metadata?.role
      }
    };
  } catch (error: any) {
    console.error('Unexpected error creating user:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
});