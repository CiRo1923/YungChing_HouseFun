import { isTrailingSlashSkipped } from '@js/runtime/trailingSlash.js'

// 網址結尾一律帶 `/`。這一層處理「原始的 HTTP 請求」——
// 外部連入、爬蟲、手打網址、初次進站的 document,對它們做真正的 301,保留 query。
//
// 站內換頁不會走到這裡(那是前端自己接管的導航),由換頁守衛那一層處理。
// 哪些路徑不補,兩層讀的是同一份判準。
export default defineEventHandler((event) => {
  const { pathname, search } = getRequestURL(event)

  if (isTrailingSlashSkipped(pathname)) return

  return sendRedirect(event, `${pathname}/${search}`, 301)
})
