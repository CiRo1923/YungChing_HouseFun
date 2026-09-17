import { isTrailingSlashSkipped } from '@js/runtime/trailingSlash.js'

// 網址結尾一律帶 `/`。這一層接的是站內換頁 ——
// 路由表已經讓連結的 href 帶了斜線,這裡補的是程式自己組出來的路徑。
//
// 哪些路徑不補,與伺服器層那一份是同一個判準。
export default defineNuxtRouteMiddleware((to) => {
  const { path, query, hash } = to

  if (isTrailingSlashSkipped(path)) return

  return navigateTo({ path: `${path}/`, query, hash }, { replace: true })
})
