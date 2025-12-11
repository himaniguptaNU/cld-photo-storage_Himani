// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
  modules: ["@nuxtjs/supabase", "@nuxtjs/tailwindcss"],
  supabase: {
    redirect: false,
    // create your own .env file and add your supabase url and key
    url: process.env.SUPABASE_URL,
    // can be found in supabase dashboard under project settings -> Data API

    key: process.env.SUPABASE_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    // can be found in supabase dashboard under project settings -> API Keys
  },
});
