import {
  apiGETCitySelectOptions,
  apiGETDistrictSelectOptions,
  apiGETRealEstatePurposeCheckOptions,
  apiGETRealEstateTypeSelectOptions,
  apiGETRealEstateFaceSelectOptions,
  apiGETRealEstateParkingModeSelectOptions,
  apiGETRealEstateNearByCheckOptions,
  apiGETRealEstateFeatureCheckOptions,
  apiGETBranchSelectOptions,
  apiGETBranchStoreSelectOptions,
} from '@js/_api/manage.js'

export default () => {
  const manage = useManageStore()
  const { options } = storeToRefs(manage)
  const { onApiError } = usePopupActions()
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
  const onApiGETRealEstatePurposeCheckOptions = async () => {
    if (options.value.casePurpose) return false
    const { config, status, data } = await apiGETRealEstatePurposeCheckOptions()

    if (status === 200) {
      options.value.casePurpose = data
        ? [
            {
              text: '不限',
              code: '',
            },
            ...data,
          ]
        : []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRealEstateTypeSelectOptions = async () => {
    if (options.value.caseType) return false

    const { config, status, data } = await apiGETRealEstateTypeSelectOptions()

    if (status === 200) {
      options.value.caseType = data
        ? [
            {
              text: '不限',
              value: '',
            },
            ...data,
          ]
        : []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRealEstateFaceSelectOptions = async () => {
    if (options.value.face) return false

    const { config, status, data } = await apiGETRealEstateFaceSelectOptions()

    if (status === 200) {
      options.value.face = data
        ? [
            {
              text: '不限',
              value: '',
            },
            ...data,
          ]
        : []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRealEstateParkingModeSelectOptions = async () => {
    if (options.value.parkingMode) return false

    const { config, status, data } = await apiGETRealEstateParkingModeSelectOptions()

    if (status === 200) {
      options.value.parkingMode = data
        ? [
            {
              text: '不限',
              value: '',
            },
            ...data,
          ]
        : []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRealEstateNearByCheckOptions = async () => {
    if (options.value.nearBy) return false

    const { config, status, data } = await apiGETRealEstateNearByCheckOptions()

    if (status === 200) {
      options.value.nearBy = data
        ? [
            {
              text: '不限',
              code: '',
            },
            ...data,
          ]
        : []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRealEstateFeatureCheckOptions = async () => {
    if (options.value.features) return false

    const { config, status, data } = await apiGETRealEstateFeatureCheckOptions()

    if (status === 200) {
      options.value.features = data
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETBranchSelectOptions = async ({ cityCode, districtCode }) => {
    const { config, status, data } = await apiGETBranchSelectOptions({
      cityCode,
      districtCode,
    })

    if (status === 200) {
      options.value.branch = data
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETBranchStoreSelectOptions = async ({ cityCode, districtCode, branchID }) => {
    const { config, status, data } = await apiGETBranchStoreSelectOptions({
      cityCode,
      districtCode,
      branchID,
    })

    if (status === 200) {
      options.value.branchStore = data
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onValueGetText = (option, value, key = 'text') => {
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

    const onGetText = (targetValue) => {
      const found = onRecursive(currOptions, targetValue)

      return found ? found[key] : ''
    }

    if (Array.isArray(value)) {
      return value
        .map((val) => onGetText(val))
        .filter(Boolean)
        .join('、')
    }

    return onGetText(value)
  }

  return {
    onApiGETCitySelectOptions,
    onApiGETDistrictSelectOptions,
    onApiGETRealEstatePurposeCheckOptions,
    onApiGETRealEstateTypeSelectOptions,
    onApiGETRealEstateFaceSelectOptions,
    onApiGETRealEstateParkingModeSelectOptions,
    onApiGETRealEstateNearByCheckOptions,
    onApiGETRealEstateFeatureCheckOptions,
    onApiGETBranchSelectOptions,
    onApiGETBranchStoreSelectOptions,
    onValueGetText,
  }
}
