import {
  apiGetCommonServerTime,
  apiGETCitySelectOptions,
  apiGETDistrictSelectOptions,
  apiGetPublishAvailablePlans,
  apiPOSTPublishSubmit,
  apiPOSTRealEstateRestoreToOnline,
  apiPOSTPublishRenewal,
  apiGETPublishGetPublishResponse,
  apiGETGoldenGetPlanList,
  apiPOSTGoldenSetPlanSingle,
  apiGETRefreshCurrentPlansForCase,
  apiGETRefreshGetPlanInfo,
} from '@js/_api/buy/common.js'

import {
  apiGETRealEstatePurposeCheckOptions,
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
} from '@js/_api/buy/publish.js'

import { onFormatDate } from '@js/_prototype.js'

import { useBuyProjectStore } from '@stores/buy/project.js'

import useBuyPopupActions from '@stores/buy/.composables/usePopupActions.js'

export default () => {
  const projectStores = useBuyProjectStore()
  const { onAlert, onCustom, onApiPromise, onApiError } = useBuyPopupActions()
  const { serverTime, renewal, autoRefresh, golden, options } = storeToRefs(projectStores)

  const onApiGetCommonServerTime = async () => {
    const { config, status, data } = await apiGetCommonServerTime()

    if (status === 200) {
      serverTime.value = {
        value: onFormatDate(data.serverTime, 'YYYY-MM-DD'),
        full: onFormatDate(data.serverTime, 'YYYY-MM-DD hh:mm:ss'),
        year: onFormatDate(data.serverTime, 'YYYY'),
        month: onFormatDate(data.serverTime, 'MM'),
        day: onFormatDate(data.serverTime, 'DD'),
        hours: onFormatDate(data.serverTime, 'hh'),
        minute: onFormatDate(data.serverTime, 'mm'),
        second: onFormatDate(data.serverTime, 'ss'),
      }
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

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
  const onApiGetPublishAvailablePlans = async (hfID) => {
    const { config, status, data } = await apiGetPublishAvailablePlans({
      userID: 0,
      hfID,
    })

    if (status === 200) {
      // const { listPlan } = data
      // console.log(data)
      renewal.value.data = data
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiPOSTPublishRenewal = async (hfIDs) => {
    const { config, status, data } = await apiPOSTPublishRenewal({
      userID: 0,
      hfIDs,
      ...renewal.value.apiData,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiPOSTPublishSubmit = async (hfIDs) => {
    const { config, status, data } = await apiPOSTPublishSubmit({
      userID: 0,
      hfIDs,
      ...renewal.value.apiData,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiPOSTRealEstateRestoreToOnline = async (hfIDs) => {
    const { config, status, data } = await apiPOSTRealEstateRestoreToOnline({
      hfIDs,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETPublishGetPublishResponse = async (hfID) => {
    const { config, status, data } = await apiGETPublishGetPublishResponse({
      hfID,
    })

    if (status === 200) {
      // const { listPlan } = data
      // console.log(data)
      autoRefresh.value.data = data
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETGoldenGetPlanList = async () => {
    const { config, status, data } = await apiGETGoldenGetPlanList()

    if (status === 200) {
      golden.value.plans = data
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiPOSTGoldenSetPlanSingle = async (hfID) => {
    const { config, status, data } = await apiPOSTGoldenSetPlanSingle({
      userID: 0,
      hfID,
      ...golden.value.apiData,
    })

    // console.log(data)

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRefreshCurrentPlansForCase = async (hfID) => {
    const { config, status, data } = await apiGETRefreshCurrentPlansForCase({
      userID: 0,
      hfID,
    })

    if (status === 200) {
      const { listPlan, ...info } = data
      autoRefresh.value.info = info
      autoRefresh.value.plans = listPlan
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRefreshGetPlanInfo = async () => {
    const { config, status, data } = await apiGETRefreshGetPlanInfo(
      autoRefresh.value.planInfo.apiData
    )

    console.log(data)

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onGoldenPopup = async (data, btns) => {
    onResetPojectData('golden')

    const isSure = await onCustom({
      id: 'popupGolden',
      title: '請選擇額度',
      data,
      icon: 'icon_quota',
      btns: [
        {
          label: '取消',
          class: '--border-gray-e5 --text-gray-666',
          type: 'cancel',
          isClose: true,
        },
        {
          label: '確認',
          class: '--bg-green-6a2d --text-white',
          type: 'sure',
          isClose: false,
        },
      ],
    })

    if (isSure) {
      onApiPromise('open')
      const { status } = await onApiPOSTGoldenSetPlanSingle(data.hfID)

      onApiPromise('close')

      if (status === 200) {
        const isAlert = await onAlert({
          title: '黃金曝光設定完成',
          icon: 'icon_check_solid',
          content: '黃金曝光設定已完成，將於 1 ~ 2 分鐘後生效',
          btns,
          setClass: {
            main: 'p:--w-800 t:--w-600',
            icon: 'text-[--orange-e646]',
            content: 'text-[--gray-666] tracking-wider',
          },
        })

        return isAlert
      }
    }

    return false
  }

  const onAutoRefreshPopup = async (data) => {
    onApiPromise('open')
    const { status } = await onApiGETRefreshCurrentPlansForCase(data.hfID)

    onApiPromise('close')

    if (status === 200) {
      const isSure = await onCustom({
        id: 'popupAutoRefresh',
        title: '自動刷新設定',
        data,
        icon: 'icon_double_star',
        btns: [
          {
            label: '取消',
            class: '--border-gray-e5 --text-gray-666',
            type: 'cancel',
            isClose: true,
          },
          {
            label: '修改儲存',
            class: '--bg-green-6a2d --text-white',
            type: 'sure',
            isClose: true,
          },
        ],
      })

      if (isSure) {
        onApiPromise('open')

        onApiPromise('close')
      }
    }

    return false
  }

  const onResetPojectData = (type) => {
    if (type === 'renewal' || !type) {
      renewal.value.apiData.planID = null
    }

    if (type === 'golden' || !type) {
      golden.value.apiData.planID = null
    }

    // if (type === 'refresh' || !type) {
    //   autoRefresh.value.apiData.planID = null
    // }
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
      [key]:
        typeof item?.[key] === 'string'
          ? item[key].replaceAll('{0}', size.width).replaceAll('{1}', size.height)
          : item?.[key],
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
    onApiGetCommonServerTime,
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
    onApiGetPublishAvailablePlans,
    onApiPOSTPublishRenewal,
    onApiPOSTPublishSubmit,
    onApiPOSTRealEstateRestoreToOnline,
    onApiGETPublishGetPublishResponse,
    onApiGETGoldenGetPlanList,
    onApiPOSTGoldenSetPlanSingle,
    onApiGETRefreshCurrentPlansForCase,
    onApiGETRefreshGetPlanInfo,
    onGoldenPopup,
    onAutoRefreshPopup,
    onResetPojectData,
    onValueGetText,
    onReplaceImageSize,
  }
}
