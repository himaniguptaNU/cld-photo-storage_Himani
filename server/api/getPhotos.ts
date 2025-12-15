import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { createClient } from '@supabase/supabase-js';

export default defineEventHandler(async (event) => {
  console.log('=== GET PHOTOS CALLED ===');
  
  const user = await serverSupabaseUser(event);

  console.log('User sub:', user?.sub);

  if (!user || !user.sub) {
    console.error('No authenticated user found');
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    });
  }

  const userId = user.sub;

  try {
    const userRole = user.user_metadata?.role || 'basic';

    console.log('Fetching photos for user:', userId);

    const config = useRuntimeConfig();
    const supabaseAdmin = createClient(
      config.public.supabase.url,
      config.supabase.serviceKey
    );

    let query = supabaseAdmin
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false });

    if (userRole !== 'admin') {
      query = query.eq('user_id', userId);
    }

    const { data: photos, error } = await query;

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Photos found:', photos?.length || 0);

    if (!photos || photos.length === 0) {
      return {
        success: true,
        photos: []
      };
    }

    const photosWithUrls = await Promise.all(
      photos.map(async (photo) => {
        const { data: urlData, error: urlError } = await supabaseAdmin
          .storage
          .from('user-photos')
          .createSignedUrl(photo.file_path, 3600);

        if (urlError) {
          console.error(`Error generating URL for photo ${photo.id}:`, urlError);
          return {
            ...photo,
            url: null
          };
        }

        return {
          ...photo,
          url: urlData.signedUrl
        };
      })
    );

    console.log('Successfully returning photos');
    return {
      success: true,
      photos: photosWithUrls
    };
  } catch (error: any) {
    console.error('Error:', error);
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch photos'
    });
  }
});


// import { serverSupabaseClient, serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server';

// export default defineEventHandler(async (event) => {
//   const user = await serverSupabaseUser(event);

//   if (!user || !user.sub) {
//     throw createError({
//       statusCode: 401,
//       message: 'Unauthorized'
//     });
//   }

//   const userId = user.sub; // Use user.sub, not user.id

//   const body = await readBody(event);
//   const { fileName, fileData, contentType } = body;

//   if (!fileName || !fileData) {
//     throw createError({
//       statusCode: 400,
//       message: 'Missing required fields'
//     });
//   }

//   try {
//     const serviceSupabase = serverSupabaseServiceRole(event);
    
//     const fileBuffer = Buffer.from(fileData, 'base64');
    
//     const fileExt = fileName.split('.').pop();
//     const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
//     const filePath = `${userId}/${uniqueFileName}`;

//     console.log('Uploading for user:', userId);
//     console.log('File path:', filePath);

//     const { data: uploadData, error: uploadError } = await serviceSupabase
//       .storage
//       .from('user-photos')
//       .upload(filePath, fileBuffer, {
//         contentType: contentType || 'image/jpeg',
//         upsert: false
//       });

//     if (uploadError) {
//       console.error('Upload error:', uploadError);
//       throw uploadError;
//     }

//     console.log('File uploaded, saving to database');

//     const { data: dbData, error: dbError } = await serviceSupabase
//       .from('photos')
//       .insert({
//         user_id: userId,
//         file_name: fileName,
//         file_path: filePath
//       })
//       .select()
//       .single();

//     if (dbError) {
//       console.error('Database error:', dbError);
//       await serviceSupabase.storage.from('user-photos').remove([filePath]);
//       throw dbError;
//     }

//     console.log('Photo saved successfully:', dbData);

//     return {
//       success: true,
//       photo: dbData
//     };
//   } catch (error: any) {
//     console.error('Upload error:', error);
//     throw createError({
//       statusCode: 500,
//       message: error.message || 'Failed to upload photo'
//     });
//   }
// });