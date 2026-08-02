// 分頁 query（pg）被手動竄改成非數字、0、負數或小數時，統一導正為 pg=1，
// 避免帶著無效值送進 API 造成系統錯誤頁
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
