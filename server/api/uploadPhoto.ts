import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server';

export default defineEventHandler(async (event) => {
  console.log('=== UPLOAD PHOTO CALLED ===');
  
  const user = await serverSupabaseUser(event);

  console.log('User sub:', user?.sub);

  if (!user || !user.sub) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    });
  }

  const userId = user.sub; // THIS IS THE KEY - use user.sub, NOT user.id

  const body = await readBody(event);
  const { fileName, fileData, contentType } = body;

  if (!fileName || !fileData) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields'
    });
  }

  try {
    const serviceSupabase = serverSupabaseServiceRole(event);
    
    const fileBuffer = Buffer.from(fileData, 'base64');
    
    const fileExt = fileName.split('.').pop();
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${uniqueFileName}`;

    console.log('Uploading for user ID:', userId);
    console.log('File path:', filePath);

    const { data: uploadData, error: uploadError } = await serviceSupabase
      .storage
      .from('user-photos')
      .upload(filePath, fileBuffer, {
        contentType: contentType || 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    console.log('File uploaded successfully, saving to database');

    const { data: dbData, error: dbError } = await serviceSupabase
      .from('photos')
      .insert({
        user_id: userId,  // Using userId which is user.sub
        file_name: fileName,
        file_path: filePath
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      await serviceSupabase.storage.from('user-photos').remove([filePath]);
      throw dbError;
    }

    console.log('Photo saved to database successfully:', dbData);

    return {
      success: true,
      photo: dbData
    };
  } catch (error: any) {
    console.error('Upload error:', error);
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to upload photo'
    });
  }
});