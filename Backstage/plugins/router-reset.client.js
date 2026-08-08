import useCommonActions from '@stores/.composables/useCommonActions.js'

export default defineNuxtPlugin(() => {
  const router = useRouter()
  const { onReset, onIsLoading } = useCommonActions()
  let isFirstNavigation = true

  router.beforeEach((to, from) => {
    if (isFirstNavigation) {
      isFirstNavigation = false
      return
    }

    // 僅 query 變動 (換頁 / 排序) 不會重建頁面元件,setup 不會再跑,
    // 這裡開了 loading 就沒人關,交由頁面的 useAsyncData 自行處理
    if (to.path === from.path) return

    onReset()
    onIsLoading(true)
  })
})
