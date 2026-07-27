import { defineStore } from 'pinia'

export const useMemberProjectStore = defineStore('memberProject', () => {
  const runtimeConfig = useRuntimeConfig()
  const isDevMode = runtimeConfig.public.NUXT_PUBLIC_APP_MODE === 'dev'
  const authToken = ref(null)
  const userData = ref(null)
  const login = ref({
    auth: {
      apiData: {
        account: isDevMode ? '0949472024' : null,
        password: isDevMode ? '12345678' : null,
      },
    },
    verify: {
      apiData: {
        account: isDevMode ? '0949472024' : null,
        code: isDevMode ? '123456' : null,
      },
    },
  })
  return {
    authToken,
    userData,
    login,
  }
})
