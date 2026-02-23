import {
  apiGETRealEstatePurposeCheckOptions,
  apiGETCitySelectOptions,
  apiGETDistrictSelectOptions,
  apiGETRealEstateTypeSelectOptions,
  apiGETRealEstateLegalUsageSelectOptions,
  apiGETRealEstateZoingCheckOptions,
  apiGETRealEstateZoingCitySelectOptions,
  apiGETRealEstateZoingLandSelectOptions,
  apiGETRealEstateFloorSelectOptions,
} from '@js/buy/_api/index.js'
import { defineStore } from 'pinia'

export const useBuyProjectStore = defineStore('buyProject', () => {
  const NAME = '好房網買屋 Housefun 管理後台'
  const options = ref({
    casePurpose: null,
    city: null,
    area: null,
    caseType: null,
    caseUsage: null,
    caseZoing: null,
    zoingCity: null,
    zoingLand: null,
    floor: null,
  })
  const apiData = ref({
    casePurposeToken: '',
    caseTitle: '',
    cityID: '',
    districtID: '',
    road: '',
    lane: '',
    alley: '',
    addrNum: '',
    addrNumOf: '',
    floor: '',
    addrNumOfFloor: '',
    caseTypeToken: '',
    caseUsageToken: '',
    caseZoingToken: '',
    caseZoingTypeToken: '',
    caseZoingTypeOther: '',
    caseLandNo: '',
    isSingleFloor: true,
    floorFromToken: '',
    caseFloorFrom: '',
    floorToToken: '',
    caseFloorTo: '',
    caseFloorTotal: '',
  })
  const onApiGETRealEstatePurposeCheckOptions = async () => {
    // const { public: env } = useRuntimeConfig()
    // const hfID = env.NUXT_PUBLIC_HFID_DEFAULT
    const { config, status, data } = await apiGETRealEstatePurposeCheckOptions()

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
  const onApiGETDistrictSelectOptions = async (cityID) => {
    const { config, status, data } = await apiGETDistrictSelectOptions({
      cityCode: cityID,
    })

    // if (status === 200) {
    //   console.log(data)
    // }

    return { config, status, data }
  }
  const onApiGETRealEstateTypeSelectOptions = async () => {
    const { config, status, data } = await apiGETRealEstateTypeSelectOptions()

    if (status === 200) {
      options.value.caseType = data || []
    }

    return { config, status, data }
  }
  const onApiGETRealEstateLegalUsageSelectOptions = async () => {
    const { config, status, data } = await apiGETRealEstateLegalUsageSelectOptions()

    if (status === 200) {
      options.value.caseUsage = data || []
    }

    return { config, status, data }
  }
  const onApiGETRealEstateZoingCheckOptions = async () => {
    const { config, status, data } = await apiGETRealEstateZoingCheckOptions()

    if (status === 200) {
      options.value.caseZoing = data || []
      apiData.value.caseZoingToken = data[0].code
    }

    return { config, status, data }
  }
  const onApiGETRealEstateZoingCitySelectOptions = async () => {
    const { config, status, data } = await apiGETRealEstateZoingCitySelectOptions()

    if (status === 200) {
      options.value.zoingCity = data || []
    }

    return { config, status, data }
  }
  const onApiGETRealEstateZoingLandSelectOptions = async () => {
    const { config, status, data } = await apiGETRealEstateZoingLandSelectOptions()

    if (status === 200) {
      options.value.zoingLand = data || []
    }

    return { config, status, data }
  }
  const onApiGETRealEstateFloorSelectOptions = async () => {
    const { config, status, data } = await apiGETRealEstateFloorSelectOptions()

    if (status === 200) {
      options.value.floor = data || []
      apiData.value.floorFromToken = data[0].value
      apiData.value.floorToToken = data[0].value
    }

    return { config, status, data }
  }

  return {
    NAME,
    options,
    apiData,
    onApiGETRealEstatePurposeCheckOptions,
    onApiGETCitySelectOptions,
    onApiGETDistrictSelectOptions,
    onApiGETRealEstateTypeSelectOptions,
    onApiGETRealEstateLegalUsageSelectOptions,
    onApiGETRealEstateZoingCheckOptions,
    onApiGETRealEstateZoingCitySelectOptions,
    onApiGETRealEstateZoingLandSelectOptions,
    onApiGETRealEstateFloorSelectOptions,
  }
})
