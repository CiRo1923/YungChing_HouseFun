export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/buy') {
    return navigateTo('/buy/1', {
      replace: true,
    })
  }
})
