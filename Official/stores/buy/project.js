import { defineStore } from 'pinia'

export const useBuyProjectStore = defineStore('buyProject', () => {
  const runtimeConfig = useRuntimeConfig()
  const isDevMode = runtimeConfig.public.NUXT_PUBLIC_APP_MODE === 'dev'
  const NAME = '好房網 買屋'
  // 買屋頻道:'region'(區域找房)/ 'mrt'(捷運找房),互斥。原在 buyList,移至此供全頻道共用。
  const channel = ref('region')
  // 頻道 tab 基礎項(區域 / 捷運 / 地圖)。原在 TabOvalResponsive,移至此供共用;
  // 需帶路由的 to(依 commonParams 等)由使用端 computed 組,這裡只放靜態 id / label / icon。
  const channelTabs = readonly([
    {
      id: 'region',
      label: '區域找房',
      icon: 'icon_loaction',
    },
    {
      id: 'mrt',
      label: '捷運找房',
      icon: 'icon_mrt',
    },
    {
      id: 'map',
      label: '地圖找房',
      icon: 'icon_map',
    },
  ])
  const apiDefault = readonly({
    message: {
      houseId: null,
      name: isDevMode ? '真測試' : null,
      phone: isDevMode ? '0912345678' : null,
      message: isDevMode ? '測試測試' : null,
    },
    verifyCode: {
      verificationToken: null,
      verificationCode: null,
    },
  })
  const access = ref({
    data: null,
  })
  const message = ref({
    data: null,
    apiData: { ...apiDefault.message },
  })
  const countdownData = ref({
    expires: null,
  })
  const apiVerifyCodeData = ref({ ...apiDefault.verifyCode })
  const cottonCandyCheckbox = ref([])

  return {
    NAME,
    channel,
    channelTabs,
    apiDefault,
    access,
    message,
    countdownData,
    apiVerifyCodeData,
    cottonCandyCheckbox,
  }
})
