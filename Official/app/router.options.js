// app/router.options.js
/** @type {import('@nuxt/schema').RouterConfig} */

// 規格:網址結尾都要以 `/` 結束。
// 站內連結多為命名路由,NuxtLink 依 route path 渲染 href;在此替每條路由 path 補上
// 結尾斜線,讓「原始碼(SSR HTML)中的 <a href>」從源頭就帶 `/`。
//
// 這裡看的是**路由的樣板**(`/buy/house/:hfid()`),不是某一次的實際網址 ——
// 所以排除條件與伺服器層、換頁守衛那兩處相反,不能共用同一份:
// 那兩處要排掉帶 `.` 的路徑(那是圖片、字型這類檔案),
// 而樣板裡的 `.` 是動態參數的一部分(`:filters(.*)*`),排掉的話所有動態頁面都不補斜線。
//
// 排除:首頁 `/`、catch-all / 可重複參數(結尾為 `*`,如 `:filters(.*)*`)與相對子路由。
// 注意:Nuxt 一般動態參數的 path 形如 `/buy/house/:hfid()`(帶空括號),須放行,
// 否則等於把所有動態頁面都排除掉。
const withTrailingSlash = (routes) =>
  routes.map((route) => {
    const next = { ...route }

    if (
      typeof next.path === 'string' &&
      next.path.startsWith('/') &&
      next.path !== '/' &&
      !next.path.startsWith('/_') &&
      !next.path.endsWith('/') &&
      !next.path.endsWith('*')
    ) {
      next.path = `${next.path}/`
    }

    if (Array.isArray(next.children)) {
      next.children = withTrailingSlash(next.children)
    }

    return next
  })

// 買屋列表對外網址由 /buy/list/... 改為 /buy/...(不動 pages 資料夾,只改 route path)。
// route name(buy-list-filters)不變,故 NuxtLink 具名路由會自動產生新網址。
const remapBuyListPath = (routes) =>
  routes.map((route) => {
    const next = { ...route }

    if (typeof next.path === 'string' && next.path.startsWith('/buy/list')) {
      next.path = `/buy${next.path.slice('/buy/list'.length)}`
    }

    if (Array.isArray(next.children)) {
      next.children = remapBuyListPath(next.children)
    }

    return next
  })

export default {
  linkActiveClass: '--active',
  linkExactActiveClass: '--exact-active',
  routes: (routes) => {
    const homeRoute = routes.find(
      (r) => typeof r.path === 'string' && r.path.toLowerCase() === '/home'
    )

    if (homeRoute) {
      homeRoute.path = '/'
      homeRoute.name = 'HomeIndex'
    }

    return withTrailingSlash(remapBuyListPath(routes))
  },
}
