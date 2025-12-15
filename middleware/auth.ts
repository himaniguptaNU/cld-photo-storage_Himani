export default defineNuxtRouteMiddleware((to, from) => {
  const user = useSupabaseUser();
  
  const publicRoutes = ['/login', '/signup'];
  
  if (!user.value && !publicRoutes.includes(to.path)) {
    return navigateTo('/login');
  }
  
  if (user.value && publicRoutes.includes(to.path)) {
    return navigateTo('/');
  }
});