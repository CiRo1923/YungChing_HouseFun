import { useCommonStore } from '@stores/common.js'

export default defineNuxtPlugin(() => {
  const router = useRouter()
  const common = useCommonStore()
  let isFirstNavigation = true

  router.beforeEach(() => {
    if (isFirstNavigation) {
      isFirstNavigation = false
      return
    }

    common.onReset()
    common.onIsLoading(true)
  })
})
