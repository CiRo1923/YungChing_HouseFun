import {
  apiGETRealEstatePurposeCheckOptions,
  apiGETCitySelectOptions,
  apiGETDistrictSelectOptions,
  apiGETRoad,
  apiGETRealEstateTypeSelectOptions,
  apiGETRealEstateLegalUsageSelectOptions,
  apiGETRealEstateZoingCheckOptions,
  apiGETRealEstateZoingCitySelectOptions,
  apiGETRealEstateZoingLandSelectOptions,
  apiGETRealEstateAgeIdentifySelectOptions,
  apiGETRealEstateFloorSelectOptions,
  apiGETCommunities,
  apiGETRealEstateFaceSelectOptions,
  apiGETRealEstateStructionSelectOptions,
  apiGETRealEstateBarrierFreeCheckOptions,
  apiGETRealEstateManageTypeSelectOptions,
  apiGETRealEstateManageDutySelectOptions,
  apiGETRealEstateManagePayPeriodSelectOptions,
  apiGETRealEstateParkingModeSelectOptions,
  apiGETRealEstateParkingTypeSelectOptions,
  apiGETRealEstateParkingRegSelectOptions,
  apiGETRealEstateParkingPayPeriodSelectOptions,
  apiGETRealEstateVideoDisplaySelectOptions,
  apiGETRealEstateVideoTypeSelectOptions,
  apiGETRealEstateFeatureCheckOptions,
  apiGETRealEstatePosterDataSourceSelectOptions,
} from '@js/_api/buy/index.js'

import { useBuyProjectStore } from '@stores/buy/project.js'

import useBuyPopupActions from '@stores/buy/composables/usePopupActions.js'

const useBuyProjectActions = () => {
  const projectStores = useBuyProjectStore()
  const { onApiError } = useBuyPopupActions()
  const { options } = storeToRefs(projectStores)

  const onApiGETRealEstatePurposeCheckOptions = async () => {
    if (options.value.casePurpose) return false

    const { config, status, data } = await apiGETRealEstatePurposeCheckOptions()

    if (status === 200) {
      options.value.casePurpose = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETCitySelectOptions = async () => {
    if (options.value.city) return false

    const { config, status, data } = await apiGETCitySelectOptions()

    if (status === 200) {
      options.value.city = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETDistrictSelectOptions = async (cityID) => {
    const { config, status, data } = await apiGETDistrictSelectOptions({
      cityCode: cityID,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    if (status === 200) {
      options.value.area = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRoad = async (cityID, AreaID) => {
    const { config, status, data } = await apiGETRoad({
      cityCode: cityID,
      districtCode: AreaID,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    // if (status === 200) {
    //   console.log(data)
    // }

    return { config, status, data }
  }
  const onApiGETRealEstateTypeSelectOptions = async () => {
    if (options.value.caseType) return false

    const { config, status, data } = await apiGETRealEstateTypeSelectOptions()

    if (status === 200) {
      options.value.caseType = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRealEstateLegalUsageSelectOptions = async () => {
    if (options.value.caseUsage) return false

    const { config, status, data } = await apiGETRealEstateLegalUsageSelectOptions()

    if (status === 200) {
      options.value.caseUsage = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRealEstateZoingCheckOptions = async () => {
    if (options.value.caseZoing) return false

    const { config, status, data } = await apiGETRealEstateZoingCheckOptions()

    if (status === 200) {
      options.value.caseZoing = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRealEstateZoingCitySelectOptions = async () => {
    if (options.value.zoingCity) return false

    const { config, status, data } = await apiGETRealEstateZoingCitySelectOptions()

    if (status === 200) {
      options.value.zoingCity = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRealEstateZoingLandSelectOptions = async () => {
    if (options.value.zoingLand) return false

    const { config, status, data } = await apiGETRealEstateZoingLandSelectOptions()

    if (status === 200) {
      options.value.zoingLand = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRealEstateAgeIdentifySelectOptions = async () => {
    if (options.value.ageIdentify) return false

    const { config, status, data } = await apiGETRealEstateAgeIdentifySelectOptions()

    if (status === 200) {
      options.value.ageIdentify = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRealEstateFloorSelectOptions = async () => {
    if (options.value.floor) return false

    const { config, status, data } = await apiGETRealEstateFloorSelectOptions()

    if (status === 200) {
      options.value.floor = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETCommunities = async (params) => {
    const { config, status, data } = await apiGETCommunities(params)

    if (status !== 200) {
      onApiError(config, status, data)
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRealEstateFaceSelectOptions = async () => {
    if (options.value.face) return false

    const { config, status, data } = await apiGETRealEstateFaceSelectOptions()

    if (status === 200) {
      options.value.face = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRealEstateStructionSelectOptions = async () => {
    if (options.value.structure) return false

    const { config, status, data } = await apiGETRealEstateStructionSelectOptions()

    if (status === 200) {
      options.value.structure = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRealEstateBarrierFreeCheckOptions = async () => {
    if (options.value.barrierFree) return false

    const { config, status, data } = await apiGETRealEstateBarrierFreeCheckOptions()

    if (status === 200) {
      options.value.barrierFree = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRealEstateManageTypeSelectOptions = async () => {
    if (options.value.manageType) return false

    const { config, status, data } = await apiGETRealEstateManageTypeSelectOptions()

    if (status === 200) {
      options.value.manageType = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRealEstateManageDutySelectOptions = async () => {
    if (options.value.manageDuty) return false

    const { config, status, data } = await apiGETRealEstateManageDutySelectOptions()

    if (status === 200) {
      options.value.manageDuty = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRealEstateManagePayPeriodSelectOptions = async () => {
    if (options.value.managePay) return false

    const { config, status, data } = await apiGETRealEstateManagePayPeriodSelectOptions()

    if (status === 200) {
      options.value.managePay = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRealEstateParkingModeSelectOptions = async () => {
    if (options.value.parkingMode) return false

    const { config, status, data } = await apiGETRealEstateParkingModeSelectOptions()

    if (status === 200) {
      options.value.parkingMode = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRealEstateParkingTypeSelectOptions = async () => {
    if (options.value.parkingType) return false

    const { config, status, data } = await apiGETRealEstateParkingTypeSelectOptions()

    if (status === 200) {
      options.value.parkingType = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRealEstateParkingRegSelectOptions = async () => {
    if (options.value.parkingReg) return false

    const { config, status, data } = await apiGETRealEstateParkingRegSelectOptions()

    if (status === 200) {
      options.value.parkingReg = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRealEstateParkingPayPeriodSelectOptions = async () => {
    if (options.value.parkingPayPeriod) return false

    const { config, status, data } = await apiGETRealEstateParkingPayPeriodSelectOptions()

    if (status === 200) {
      options.value.parkingPayPeriod = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRealEstateVideoDisplaySelectOptions = async () => {
    if (options.value.videoDisplay) return false

    const { config, status, data } = await apiGETRealEstateVideoDisplaySelectOptions()

    if (status === 200) {
      options.value.videoDisplay = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRealEstateVideoTypeSelectOptions = async () => {
    if (options.value.videoType) return false

    const { config, status, data } = await apiGETRealEstateVideoTypeSelectOptions()

    if (status === 200) {
      options.value.videoType = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRealEstateFeatureCheckOptions = async () => {
    if (options.value.feature) return false

    const { config, status, data } = await apiGETRealEstateFeatureCheckOptions()

    if (status === 200) {
      options.value.feature = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRealEstatePosterDataSourceSelectOptions = async () => {
    if (options.value.posterDataSource) return false

    const { config, status, data } = await apiGETRealEstatePosterDataSourceSelectOptions()

    if (status === 200) {
      options.value.posterDataSource = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onValueGetText = (option, value) => {
    const isOptionString = typeof option === 'string'
    const currOptions = isOptionString ? options.value[option] : option || []
    const onRecursive = (list, targetValue) => {
      if (list) {
        for (const item of list) {
          // 直接掃整個物件的值
          if (Object.values(item).includes(targetValue)) {
            return item
          }

          // recursion
          for (const value of Object.values(item)) {
            if (Array.isArray(value)) {
              const found = onRecursive(value, targetValue)
              if (found) return found
            } else if (value && typeof value === 'object') {
              const found = onRecursive([value], targetValue)
              if (found) return found
            }
          }
        }
      }

      return null
    }

    return onRecursive(currOptions, value) || {}
  }
  const onReplaceImageSize = (data, key, size) => {
    const onReplaceKey = (item) => ({
      ...item,
      url: item[key].replaceAll('{0}', size.width).replaceAll('{1}', size.height),
    })

    if (Array.isArray(data)) {
      return data.map(onReplaceKey)
    }

    if (typeof data === 'object' && data !== null) {
      return onReplaceKey(data)
    }

    return data
  }

  return {
    onApiGETRealEstatePurposeCheckOptions,
    onApiGETCitySelectOptions,
    onApiGETDistrictSelectOptions,
    onApiGETRoad,
    onApiGETRealEstateTypeSelectOptions,
    onApiGETRealEstateLegalUsageSelectOptions,
    onApiGETRealEstateZoingCheckOptions,
    onApiGETRealEstateZoingCitySelectOptions,
    onApiGETRealEstateZoingLandSelectOptions,
    onApiGETRealEstateAgeIdentifySelectOptions,
    onApiGETRealEstateFloorSelectOptions,
    onApiGETCommunities,
    onApiGETRealEstateFaceSelectOptions,
    onApiGETRealEstateStructionSelectOptions,
    onApiGETRealEstateBarrierFreeCheckOptions,
    onApiGETRealEstateManageTypeSelectOptions,
    onApiGETRealEstateManageDutySelectOptions,
    onApiGETRealEstateManagePayPeriodSelectOptions,
    onApiGETRealEstateParkingModeSelectOptions,
    onApiGETRealEstateParkingTypeSelectOptions,
    onApiGETRealEstateParkingRegSelectOptions,
    onApiGETRealEstateParkingPayPeriodSelectOptions,
    onApiGETRealEstateVideoDisplaySelectOptions,
    onApiGETRealEstateVideoTypeSelectOptions,
    onApiGETRealEstateFeatureCheckOptions,
    onApiGETRealEstatePosterDataSourceSelectOptions,
    onValueGetText,
    onReplaceImageSize,
  }
}

export default useBuyProjectActions
