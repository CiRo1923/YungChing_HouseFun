// 標了 requiresAuth 的頁面才檢查。登入狀態續不回來就送去登入頁,
// 並把原本要去的網址帶著,登入完再回來。
export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.meta.requiresAuth) return

  const { onAccessCheck } = useProjectActions()

  if (await onAccessCheck(to.meta.channel)) return

  return navigateTo({
    name: 'member-login',
    query: {
      redirect: to.fullPath,
    },
  })
})
