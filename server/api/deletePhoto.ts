// import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';

// export default defineEventHandler(async (event) => {
//   const supabase = await serverSupabaseClient(event);
//   const user = await serverSupabaseUser(event);

//   if (!user) {
//     throw createError({
//       statusCode: 401,
//       message: 'Unauthorized'
//     });
//   }

//   const body = await readBody(event);
//   const { photoId, filePath } = body;

//   if (!photoId || !filePath) {
//     throw createError({
//       statusCode: 400,
//       message: 'Missing required fields'
//     });
//   }

//   try {
//     const userRole = user.user_metadata?.role || 'basic';

//     const { data: photo, error: fetchError } = await supabase
//       .from('photos')
//       .select('user_id')
//       .eq('id', photoId)
//       .single();

//     if (fetchError) {
//       throw fetchError;
//     }

//     if (photo.user_id !== user.id && userRole !== 'admin') {
//       throw createError({
//         statusCode: 403,
//         message: 'Unauthorized to delete this photo'
//       });
//     }

//     const { error: storageError } = await supabase
//       .storage
//       .from('user-photos')
//       .remove([filePath]);

//     if (storageError) {
//       console.error('Storage deletion error:', storageError);
//     }

//     const { error: dbError } = await supabase
//       .from('photos')
//       .delete()
//       .eq('id', photoId);

//     if (dbError) {
//       throw dbError;
//     }

//     return {
//       success: true
//     };
//   } catch (error: any) {
//     console.error('Delete error:', error);
//     throw createError({
//       statusCode: 500,
//       message: error.message || 'Failed to delete photo'
//     });
//   }
// });


import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);

  if (!user || !user.sub) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    });
  }

  const userId = user.sub; // Use user.sub, not user.id

  const body = await readBody(event);
  const { photoId, filePath } = body;

  if (!photoId || !filePath) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields'
    });
  }

  try {
    const userRole = user.user_metadata?.role || 'basic';
    
    // Use service role to bypass RLS
    const serviceSupabase = serverSupabaseServiceRole(event);

    // Fetch photo to check ownership
    const { data: photo, error: fetchError } = await serviceSupabase
      .from('photos')
      .select('user_id')
      .eq('id', photoId)
      .single();

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      throw fetchError;
    }


    if (photo.user_id !== userId && userRole !== 'admin') {
      throw createError({
        statusCode: 403,
        message: 'Unauthorized to delete this photo'
      });
    }

    // Delete from storage first
    const { error: storageError } = await serviceSupabase
      .storage
      .from('user-photos')
      .remove([filePath]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);

    }

    // Delete from database
    const { error: dbError } = await serviceSupabase
      .from('photos')
      .delete()
      .eq('id', photoId);

    if (dbError) {
      console.error('Database deletion error:', dbError);
      throw dbError;
    }

    console.log('Photo deleted successfully:', photoId);

    return {
      success: true,
      message: 'Photo deleted successfully'
    };
  } catch (error: any) {
    console.error('Delete error:', error);
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to delete photo'
    });
  }
});