// app/router.options.js
/** @type {import('@nuxt/schema').RouterConfig} */

export default {
  routes: (routes) => {
    const homeRoute = routes.find((r) =>
      typeof r.path === 'string' && r.path.toLowerCase() === '/home'
    )

    if (homeRoute) {
      homeRoute.path = '/'
      homeRoute.name = 'HomeIndex'
    }

    return routes
  },
}