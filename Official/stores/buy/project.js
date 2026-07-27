import { defineStore } from 'pinia'

export const useBuyProjectStore = defineStore('buyProject', () => {
  const runtimeConfig = useRuntimeConfig()
  const isDevMode = runtimeConfig.public.NUXT_PUBLIC_APP_MODE === 'dev'
  const NAME = '好房網 買屋'
  const accessData = ref(null)
  const apiMessageDataDefault = readonly({
    houseId: null,
    name: isDevMode ? '真測試' : null,
    phone: isDevMode ? '0912345678' : null,
    message: isDevMode ? '測試測試' : null,
  })
  const apiMessageData = ref({ ...apiMessageDataDefault })
  const messageData = ref(null)
  const countdownData = ref({
    expires: null,
  })
  const apiVerifyCodeDataDefault = readonly({
    verificationToken: null,
    verificationCode: null,
  })
  const apiVerifyCodeData = ref({ ...apiVerifyCodeDataDefault })
  const cottonCandyCheckbox = ref([])

  return {
    NAME,
    accessData,
    apiMessageDataDefault,
    apiMessageData,
    messageData,
    countdownData,
    apiVerifyCodeDataDefault,
    apiVerifyCodeData,
    cottonCandyCheckbox,
  }
})
