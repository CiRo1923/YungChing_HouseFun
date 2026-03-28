export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/buy' || to.path === '/buy/') {
    return navigateTo('/buy/region?pg=1', {
      replace: true,
    })
  }
})
