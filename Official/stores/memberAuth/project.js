export const useMemberAuthProjectStore = defineStore('memberAuthProject', () => {
  const runtimeConfig = useRuntimeConfig()
  const isDevMode = runtimeConfig.public.NUXT_PUBLIC_APP_MODE === 'dev'
  const authToken = ref(null)
  const userData = ref(null)
  // dev 模式帶預設值方便測試。清空登入狀態時要還原成這一組(不是清成 null),
  // 否則每次進登入頁都得重打帳密。
  const apiDefault = readonly({
    auth: {
      account: isDevMode ? '0949472024' : null,
      password: isDevMode ? '12345678' : null,
    },
    verify: {
      account: isDevMode ? '0949472024' : null,
      code: isDevMode ? '123456' : null,
    },
  })
  const login = ref({
    auth: {
      apiData: { ...apiDefault.auth },
    },
    verify: {
      apiData: { ...apiDefault.verify },
    },
  })
  return {
    apiDefault,
    authToken,
    userData,
    login,
  }
})
