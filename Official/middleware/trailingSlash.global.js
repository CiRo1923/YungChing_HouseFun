// 規格:站內網址結尾都要以 `/` 結束。
// 站內連結多為命名路由(router 依 route name 生成路徑,無法從字串源頭補斜線),
// 故在每次導航(client + SSR)時統一正規化:pathname 沒斜線就補上,保留 query / hash。
export default defineNuxtRouteMiddleware((to) => {
  const { path, query, hash } = to

  // 略過:首頁、已帶斜線、含副檔名(檔案)、以及 Nuxt 內部路由(/_ 開頭,如 /__nuxt_error)
  if (path === '/' || path.endsWith('/') || path.includes('.') || path.startsWith('/_')) return

  return navigateTo({ path: `${path}/`, query, hash }, { replace: true })
})
