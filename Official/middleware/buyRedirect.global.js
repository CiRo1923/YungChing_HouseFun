export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/buy') {
    return navigateTo('/buy/region/1', {
      replace: true,
    })
  }
})
