import { apiGETEealEstatePurposeCheckOptions, apiGETCitySelectOptions } from '@js/buy/_api/index.js'
import { defineStore } from 'pinia'

export const useBuyProjectStore = defineStore('buyProject', () => {
  const NAME = '好房網買屋 Housefun 管理後台'
  const options = ref({
    casePurpose: null,
    city: null,
  })
  const onApiGETEealEstatePurposeCheckOptions = async () => {
    // const { public: env } = useRuntimeConfig()
    // const hfID = env.NUXT_PUBLIC_HFID_DEFAULT
    const { config, status, data } = await apiGETEealEstatePurposeCheckOptions()

    if (status === 200) {
      options.value.casePurpose = data || []
    }

    return { config, status, data }
  }
  const onApiGETCitySelectOptions = async () => {
    const { config, status, data } = await apiGETCitySelectOptions()

    if (status === 200) {
      options.value.city = data || []
    }

    return { config, status, data }
  }

  return {
    NAME,
    options,
    onApiGETEealEstatePurposeCheckOptions,
    onApiGETCitySelectOptions,
  }
})
