import {
  apiGETCitySelectOptions,
  // apiGETDistrictSelectOptions,
  apiGETRealEstatePurposeCheckOptions,
  apiGETRealEstateTypeSelectOptions,
  // apiGETRoad,
  // apiGETRealEstateLegalUsageSelectOptions,
  // apiGETRealEstateZoingCheckOptions,
  // apiGETRealEstateZoingCitySelectOptions,
  // apiGETRealEstateZoingLandSelectOptions,
  // apiGETRealEstateAgeIdentifySelectOptions,
  // apiGETRealEstateFloorSelectOptions,
  // apiGETRealEstateFaceSelectOptions,
  // apiGETRealEstateStructionSelectOptions,
  // apiGETRealEstateBarrierFreeCheckOptions,
  // apiGETRealEstateManageTypeSelectOptions,
  // apiGETRealEstateManageDutySelectOptions,
  // apiGETRealEstateManagePayPeriodSelectOptions,
  // apiGETRealEstateParkingModeSelectOptions,
  apiGETRealEstateParkingTypeSelectOptions,
  // apiGETRealEstateParkingRegSelectOptions,
  // apiGETRealEstateParkingPayPeriodSelectOptions,
  // apiGETRealEstateVideoDisplaySelectOptions,
  // apiGETRealEstateVideoTypeSelectOptions,
  // apiGETRealEstateFeatureCheckOptions,
  // apiGETRealEstatePosterDataSourceSelectOptions,
} from '@js/buy/_api/manage.js'

import { onDevice } from '@js/_prototype.js'

import { useProjectStore } from '@stores/buy/project.js'

const useProjectStores = () => {
  const projectStores = useProjectStore()
  const { device, options } = storeToRefs(projectStores)

  const onApiGETCitySelectOptions = async () => {
    const { config, status, data } = await apiGETCitySelectOptions()

    if (status === 200) {
      options.value.city = data || []
    }

    return { config, status, data }
  }

  const onApiGETRealEstatePurposeCheckOptions = async () => {
    // const { public: env } = useRuntimeConfig()
    // const hfID = env.NUXT_PUBLIC_HFID_DEFAULT
    const { config, status, data } = await apiGETRealEstatePurposeCheckOptions()

    if (status === 200) {
      console.log(data)

      options.value.casePurpose = data || []
    }

    return { config, status, data }
  }

  // const onApiGETDistrictSelectOptions = async (cityID) => {
  //   const { config, status, data } = await apiGETDistrictSelectOptions({
  //     cityCode: cityID,
  //   })

  //   // if (status === 200) {
  //   //   console.log(data)
  //   // }

  //   return { config, status, data }
  // }

  // const onApiGETRoad = async (cityID, AreaID) => {
  //   const { config, status, data } = await apiGETRoad({
  //     cityCode: cityID,
  //     districtCode: AreaID,
  //   })

  //   // if (status === 200) {
  //   //   console.log(data)
  //   // }

  //   return { config, status, data }
  // }

  const onApiGETRealEstateTypeSelectOptions = async () => {
    const { config, status, data } = await apiGETRealEstateTypeSelectOptions()

    if (status === 200) {
      options.value.caseType = data || []
    }

    return { config, status, data }
  }

  // const onApiGETRealEstateLegalUsageSelectOptions = async () => {
  //   const { config, status, data } = await apiGETRealEstateLegalUsageSelectOptions()

  //   if (status === 200) {
  //     options.value.caseUsage = data || []
  //   }

  //   return { config, status, data }
  // }

  // const onApiGETRealEstateZoingCheckOptions = async () => {
  //   const { config, status, data } = await apiGETRealEstateZoingCheckOptions()

  //   if (status === 200) {
  //     options.value.caseZoing = data || []
  //   }

  //   return { config, status, data }
  // }

  // const onApiGETRealEstateZoingCitySelectOptions = async () => {
  //   const { config, status, data } = await apiGETRealEstateZoingCitySelectOptions()

  //   if (status === 200) {
  //     options.value.zoingCity = data || []
  //   }

  //   return { config, status, data }
  // }

  // const onApiGETRealEstateZoingLandSelectOptions = async () => {
  //   const { config, status, data } = await apiGETRealEstateZoingLandSelectOptions()

  //   if (status === 200) {
  //     options.value.zoingLand = data || []
  //   }

  //   return { config, status, data }
  // }

  // const onApiGETRealEstateAgeIdentifySelectOptions = async () => {
  //   const { config, status, data } = await apiGETRealEstateAgeIdentifySelectOptions()

  //   if (status === 200) {
  //     options.value.ageIdentify = data || []
  //   }

  //   return { config, status, data }
  // }

  // const onApiGETRealEstateFloorSelectOptions = async () => {
  //   const { config, status, data } = await apiGETRealEstateFloorSelectOptions()

  //   if (status === 200) {
  //     options.value.floor = data || []
  //   }

  //   return { config, status, data }
  // }

  // const onApiGETRealEstateFaceSelectOptions = async () => {
  //   const { config, status, data } = await apiGETRealEstateFaceSelectOptions()

  //   if (status === 200) {
  //     options.value.face = data || []
  //   }

  //   return { config, status, data }
  // }

  // const onApiGETRealEstateStructionSelectOptions = async () => {
  //   const { config, status, data } = await apiGETRealEstateStructionSelectOptions()

  //   if (status === 200) {
  //     options.value.structure = data || []
  //   }

  //   return { config, status, data }
  // }

  // const onApiGETRealEstateBarrierFreeCheckOptions = async () => {
  //   const { config, status, data } = await apiGETRealEstateBarrierFreeCheckOptions()

  //   if (status === 200) {
  //     options.value.barrierFree = data || []
  //   }

  //   return { config, status, data }
  // }

  // const onApiGETRealEstateManageTypeSelectOptions = async () => {
  //   const { config, status, data } = await apiGETRealEstateManageTypeSelectOptions()

  //   if (status === 200) {
  //     options.value.manageType = data || []
  //   }

  //   return { config, status, data }
  // }

  // const onApiGETRealEstateManageDutySelectOptions = async () => {
  //   const { config, status, data } = await apiGETRealEstateManageDutySelectOptions()

  //   if (status === 200) {
  //     options.value.manageDuty = data || []
  //   }

  //   return { config, status, data }
  // }

  // const onApiGETRealEstateManagePayPeriodSelectOptions = async () => {
  //   const { config, status, data } = await apiGETRealEstateManagePayPeriodSelectOptions()

  //   if (status === 200) {
  //     options.value.managePay = data || []
  //   }

  //   return { config, status, data }
  // }

  // const onApiGETRealEstateParkingModeSelectOptions = async () => {
  //   const { config, status, data } = await apiGETRealEstateParkingModeSelectOptions()

  //   if (status === 200) {
  //     options.value.parkingMode = data || []
  //   }

  //   return { config, status, data }
  // }

  const onApiGETRealEstateParkingTypeSelectOptions = async () => {
    const { config, status, data } = await apiGETRealEstateParkingTypeSelectOptions()

    if (status === 200) {
      options.value.parkingType = data || []
    }

    return { config, status, data }
  }

  // const onApiGETRealEstateParkingRegSelectOptions = async () => {
  //   const { config, status, data } = await apiGETRealEstateParkingRegSelectOptions()

  //   if (status === 200) {
  //     options.value.parkingReg = data || []
  //   }

  //   return { config, status, data }
  // }

  // const onApiGETRealEstateParkingPayPeriodSelectOptions = async () => {
  //   const { config, status, data } = await apiGETRealEstateParkingPayPeriodSelectOptions()

  //   if (status === 200) {
  //     options.value.parkingPayPeriod = data || []
  //   }

  //   return { config, status, data }
  // }

  // const onApiGETRealEstateVideoDisplaySelectOptions = async () => {
  //   const { config, status, data } = await apiGETRealEstateVideoDisplaySelectOptions()

  //   if (status === 200) {
  //     options.value.videoDisplay = data || []
  //   }

  //   return { config, status, data }
  // }

  // const onApiGETRealEstateVideoTypeSelectOptions = async () => {
  //   const { config, status, data } = await apiGETRealEstateVideoTypeSelectOptions()

  //   if (status === 200) {
  //     options.value.videoType = data || []
  //   }

  //   return { config, status, data }
  // }

  // const onApiGETRealEstateFeatureCheckOptions = async () => {
  //   const { config, status, data } = await apiGETRealEstateFeatureCheckOptions()

  //   if (status === 200) {
  //     options.value.feature = data || []
  //   }

  //   return { config, status, data }
  // }

  // const onApiGETRealEstatePosterDataSourceSelectOptions = async () => {
  //   const { config, status, data } = await apiGETRealEstatePosterDataSourceSelectOptions()

  //   if (status === 200) {
  //     options.value.posterDataSource = data || []
  //   }

  //   return { config, status, data }
  // }

  const onValueGetText = (optionName, value) => {
    const currOptions = options.value[optionName] || []

    return currOptions.find((item) => item.value === value + '')?.text ?? null
  }

  const onResize = (type) => {
    const isAdd = type === 'add'
    const isRemove = type === 'remove'
    const resize = () => {
      device.value = onDevice()
    }

    if (isAdd) {
      resize()
      window.addEventListener('resize', resize)
    }

    if (isRemove) {
      window.removeEventListener('resize', resize)
    }
  }

  return {
    onApiGETCitySelectOptions,
    onApiGETRealEstatePurposeCheckOptions,
    onApiGETRealEstateTypeSelectOptions,
    // onApiGETDistrictSelectOptions,
    // onApiGETRoad,
    // onApiGETRealEstateLegalUsageSelectOptions,
    // onApiGETRealEstateZoingCheckOptions,
    // onApiGETRealEstateZoingCitySelectOptions,
    // onApiGETRealEstateZoingLandSelectOptions,
    // onApiGETRealEstateAgeIdentifySelectOptions,
    // onApiGETRealEstateFloorSelectOptions,
    // onApiGETRealEstateFaceSelectOptions,
    // onApiGETRealEstateStructionSelectOptions,
    // onApiGETRealEstateBarrierFreeCheckOptions,
    // onApiGETRealEstateManageTypeSelectOptions,
    // onApiGETRealEstateManageDutySelectOptions,
    // onApiGETRealEstateManagePayPeriodSelectOptions,
    // onApiGETRealEstateParkingModeSelectOptions,
    onApiGETRealEstateParkingTypeSelectOptions,
    // onApiGETRealEstateParkingRegSelectOptions,
    // onApiGETRealEstateParkingPayPeriodSelectOptions,
    // onApiGETRealEstateVideoDisplaySelectOptions,
    // onApiGETRealEstateVideoTypeSelectOptions,
    // onApiGETRealEstateFeatureCheckOptions,
    // onApiGETRealEstatePosterDataSourceSelectOptions,
    onValueGetText,
    onResize,
  }
}

export default useProjectStores
