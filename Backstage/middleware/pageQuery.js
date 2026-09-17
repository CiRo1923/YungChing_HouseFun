// 分頁 query(pg)被手動竄改成非數字、0、負數或小數時,統一導正為 pg=1,
// 避免帶著無效值送進 API 造成系統錯誤頁。
//
// 掛在有分頁的那幾頁上而不是全站:只有列表頁吃這個參數,
// 設成全站的話,每一次導航都要先看一遍 query 才發現不是自己的事。
export default defineNuxtRouteMiddleware((to) => {
  const { pg } = to.query

  if (pg == null) return

  const page = Number.parseInt(pg, 10)
  const isValid = page >= 1 && String(page) === String(pg)

  if (isValid) return

  return navigateTo(
    {
      path: to.path,
      query: {
        ...to.query,
        pg: 1,
      },
      hash: to.hash,
    },
    {
      replace: true,
    }
  )
})
