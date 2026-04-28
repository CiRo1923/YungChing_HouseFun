import useCommonActions from '@stores/_composables/useCommonActions.js'

export default defineNuxtPlugin(() => {
  const router = useRouter()
  const { onReset, onIsLoading } = useCommonActions()
  let isFirstNavigation = true

  router.beforeEach(() => {
    if (isFirstNavigation) {
      isFirstNavigation = false
      return
    }

    onReset()
    onIsLoading(true)
  })
})
