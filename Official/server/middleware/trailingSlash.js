// 規格:網址結尾都要以 `/` 結束。
// 伺服器層對「原始 HTTP 請求」(外部連入、爬蟲、手打網址、初次進站的 document)
// 做真正的 301 導向,將無結尾斜線的網址轉正,保留 query string。
// 站內 SPA 導航另由 middleware/trailingSlash.global.js 處理。
export default defineEventHandler((event) => {
  const { pathname, search } = getRequestURL(event)

  // 排除:首頁、已帶斜線、含副檔名的靜態檔、Nuxt 內部路由(/_ 開頭,如 /_nuxt、/__nuxt_error、/_ipx)與 API 路徑
  if (
    pathname === '/' ||
    pathname.endsWith('/') ||
    pathname.includes('.') ||
    pathname.startsWith('/_') ||
    pathname.startsWith('/api')
  ) {
    return
  }

  return sendRedirect(event, `${pathname}/${search}`, 301)
})
