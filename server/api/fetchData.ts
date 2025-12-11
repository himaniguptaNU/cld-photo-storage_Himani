import { serverSupabaseClient } from "#supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// Example of how to get data from supabase though Nuxt's server API

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const client = await serverSupabaseClient(event);
  const { data, error } = await getTableData(client, body.table);
  //   const { data, error } = await getStorageUrl(client, body);
  if (error && error.message) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }
  return data;
});

// Quick example of how to query a table
async function getTableData(client: SupabaseClient, tableName: string) {
  const { data, error } = await client.from(tableName).select("*");
  return { data, error };
}

// Quick example of how to get an images public url. Will not work if a bucket is private.
async function getStorageUrl(client: SupabaseClient, body: any) {
  const { data } = await client.storage
    .from(body.bucket)
    .getPublicUrl(body.fileName);

  return data;
}
