import {
  apiGETRealEstatePurposeCheckOptions,
  apiGETRealEstateTypeSelectOptions,
  apiGETRealEstateFaceSelectOptions,
  apiGETRealEstateParkingModeSelectOptions,
  apiGETRealEstateNearByCheckOptions,
} from '@js/_api/buy/manage.js'

import { useBuyProjectStore } from '@stores/buy/project.js'
import useBuyPopupActions from '@stores/buy/.composables/usePopupActions.js'

const useBuyProjectStores = () => {
  const buyProject = useBuyProjectStore()
  const { options } = storeToRefs(buyProject)
  const { onApiError } = useBuyPopupActions()

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

  const onSearchParams = (path) => {
    const headers = useRequestHeaders(['host'])
    const domain = import.meta.server ? headers.host : window.location.host
    const url = new URL(path, `https://${domain}`)

    return url.searchParams.size !== 0 ? Object.fromEntries(url.searchParams) : null
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
  const onResolveByDevice = (value, device) => {
    const breakpointDeviceKeys = {
      p: ['p', 'pt'],
      t: ['t', 'pt', 'tm'],
      m: ['m', 'tm'],
    }

    if (value != null && typeof value !== 'object') return value

    const keys = breakpointDeviceKeys[device] || []
    const matchedKey = keys.find((key) => value[key] != null && value[key] !== false)

    return matchedKey !== undefined ? value[matchedKey] : null
  }

  return {
    onApiGETRealEstatePurposeCheckOptions,
    onApiGETRealEstateTypeSelectOptions,
    onApiGETRealEstateFaceSelectOptions,
    onApiGETRealEstateParkingModeSelectOptions,
    onApiGETRealEstateNearByCheckOptions,
    onSearchParams,
    onValueGetText,
    onResolveByDevice,
  }
}

export default useBuyProjectStores
