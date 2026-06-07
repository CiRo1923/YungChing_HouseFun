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
  apiGETRefreshNewPlan,
  apiGETRefreshGetPlanInfo,
  apiGETRefreshAvailablePlans,
  apiPOSTRefreshSavePlan,
  apiGETRefreshTemplateAvailableTemplates,
  apiPOSTRefreshSavePlanTemplate,
  apiGETRefreshTemplateGetTemplateInfo,
  apiPOSTRefreshTemplateSaveTemplate,
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
import { useBuyPublishStore } from '@stores/buy/publish.js'

import useBuyPopupActions from '@stores/buy/.composables/usePopupActions.js'

// 套用範本流程的頁面更新 callback。「編輯」按鈕位於全域 popup 內無法透過 props 取得 update，
// 故以模組層級保存，讓編輯後重新進入流程仍能於成功後刷新頁面。
let autoRefreshTemplateUpdate = null

export default () => {
  const projectStores = useBuyProjectStore()
  const { onAlert, onCustom, onApiPromise, onApiError } = useBuyPopupActions()
  const { serverTime, renewal, autoRefresh, golden, options } = storeToRefs(projectStores)
  const buyPublish = useBuyPublishStore()
  const { apiData } = storeToRefs(buyPublish)
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
    const { casePurposeToken } = apiData.value.caseInfo

    const { config, status, data } = await apiGETRealEstateTypeSelectOptions({
      purposeToken: casePurposeToken,
    })

    if (status === 200) {
      options.value.caseType = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRealEstateLegalUsageSelectOptions = async () => {
    const { casePurposeToken } = apiData.value.caseInfo

    const { config, status, data } = await apiGETRealEstateLegalUsageSelectOptions({
      purposeToken: casePurposeToken,
    })

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
    const { casePurposeToken } = apiData.value.caseInfo
    const { config, status, data } = await apiGETRealEstateFeatureCheckOptions({
      purposeToken: casePurposeToken,
    })

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
  const onApiGETRefreshNewPlan = async (hfID) => {
    const { config, status, data } = await apiGETRefreshNewPlan({
      userId: 0,
      hfID,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRefreshGetPlanInfo = async () => {
    const { hfID, vasID } = autoRefresh.value.save.apiData
    const { config, status, data } = await apiGETRefreshGetPlanInfo({
      userId: 0,
      hfID,
      vasID,
    })

    // console.log(data)

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRefreshAvailablePlans = async () => {
    const { hfID, listSelectedRefreshTime } = autoRefresh.value.save.apiData
    const { config, status, data } = await apiGETRefreshAvailablePlans({
      userID: 0,
      hfID,
      expectedCount: listSelectedRefreshTime.length,
    })

    if (status === 200) {
      const { listPlan, ...info } = data
      autoRefresh.value.availableInfo = info
      autoRefresh.value.availablePlans = listPlan
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiPOSTRefreshSavePlan = async () => {
    const { config, status, data } = await apiPOSTRefreshSavePlan({
      userID: 0,
      ...autoRefresh.value.save.apiData,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRefreshTemplateAvailableTemplates = async (hfID) => {
    const { config, status, data } = await apiGETRefreshTemplateAvailableTemplates({
      hfID,
    })

    if (status === 200) {
      const { listTemplate, ...info } = data
      autoRefresh.value.templateSave.info = info
      autoRefresh.value.templateSave.list = listTemplate
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiPOSTRefreshSavePlanTemplate = async () => {
    const { config, status, data } = await apiPOSTRefreshSavePlanTemplate({
      userID: 0,
      ...autoRefresh.value.templateSave.apiData,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRefreshTemplateGetTemplateInfo = async () => {
    const { config, status, data } = await apiGETRefreshTemplateGetTemplateInfo({
      userId: 0,
      ...autoRefresh.value.templateSaveTime.apiData,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  const onApiPOSTRefreshTemplateSaveTemplate = async () => {
    const { config, status, data } = await apiPOSTRefreshTemplateSaveTemplate(
      autoRefresh.value.templateSaveTime.apiData
    )

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  const onGoldenPopup = async (objectData, btns) => {
    onResetPojectData('golden')

    const { isSure } = await onCustom({
      id: 'popupGolden',
      title: '請選擇額度',
      data: objectData,
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
      const { status } = await onApiPOSTGoldenSetPlanSingle(objectData.hfID)

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

  const onAutoRefreshPopup = async (objectData) => {
    onApiPromise('open')
    const { status } = await onApiGETRefreshCurrentPlansForCase(objectData.hfID)

    onApiPromise('close')

    if (status === 200) {
      await onCustom({
        id: 'popupAutoRefresh',
        title: '自動刷新設定',
        data: objectData,
        icon: 'icon_double_star',
        btns: [
          {
            label: '取消',
            class: '--border-gray-e5 --text-gray-666',
            type: 'cancel',
            isClose: true,
          },
        ],
      })
    }

    return false
  }
  // 增加刷新次數 popup
  const onAutoRefreshAddTimePopup = async (objectData) => {
    const { status, data } = await onApiGETRefreshNewPlan(objectData.hfID)

    if (status === 200) {
      const { isSure: isAddTime, item } = await onCustom({
        id: 'popupAutoRefreshAddTime',
        title: '增加刷新次數',
        icon: 'icon_double_star',
        data,
        btns: [
          {
            id: 'cancel',
            label: '取消',
            class: '--border-gray-e5 --text-gray-666',
            type: 'cancel',
            isClose: true,
          },
          {
            id: 'back',
            label: '上一步',
            class: '--border-gray-e5 --text-gray-666',
            type: 'cancel',
            isClose: true,
          },
          {
            id: 'sure',
            label: '確認',
            class: '--bg-green-6a2d --text-white',
            type: 'sure',
            isClose: false,
          },
        ],
      })

      if (isAddTime) {
        return true
      } else if (item?.id === 'back') {
        await onAutoRefreshPopup(objectData)
      }
    }
  }
  // 請選擇額度 popup（增加刷新次數流程）
  const onAutoRefreshRenewalPopup = async () => {
    const { isSure: isRenewal, item } = await onCustom({
      id: 'popupAutoRefreshRenewal',
      title: '請選擇額度',
      icon: 'icon_quota',
      btns: [
        {
          id: 'cancel',
          label: '取消',
          class: '--border-gray-e5 --text-gray-666',
          type: 'cancel',
          isClose: true,
        },
        {
          id: 'back',
          label: '上一步',
          class: '--border-gray-e5 --text-gray-666',
          type: 'cancel',
          isClose: true,
        },
        {
          id: 'sure',
          label: '確定，使用額度',
          class: '--bg-green-6a2d --text-white',
          type: 'sure',
          isClose: false,
        },
      ],
    })

    if (isRenewal) return 'sure'

    return item?.id ?? 'cancel' // 'back' | 'cancel'，由 onClick 決定退回哪一步
  }
  const onAutoRefreshTemplatePopup = async (objectData) => {
    onApiPromise('open')

    const { status, data } = await onApiGETRefreshTemplateAvailableTemplates(objectData.hfID)

    onApiPromise('close')

    if (status === 200) {
      const { isSure: isListTemplate, item } = await onCustom({
        id: 'popupAutoRefreshTemplate',
        title: '請選擇範本',
        icon: 'icon_copy',
        data,
        btns: [
          {
            id: 'cancel',
            label: '取消',
            class: '--border-gray-e5 --text-gray-666',
            type: 'cancel',
            isClose: true,
          },
          {
            id: 'back',
            label: '上一步',
            class: '--border-gray-e5 --text-gray-666',
            type: 'cancel',
            isClose: true,
          },
          {
            id: 'sure',
            label: '確認',
            class: '--bg-green-6a2d --text-white',
            type: 'sure',
            isClose: false,
          },
        ],
      })

      if (isListTemplate) {
        return true
      } else if (item?.id === 'back') {
        await onAutoRefreshPopup(objectData)
      }
    }
  }
  const onAutoRefreshTemplateCheckPopup = async () => {
    const { isSure: isCheck, item } = await onCustom({
      id: 'popupAutoRefreshTemplateCheck',
      title: '刷新變更確認',
      icon: 'icon_template',
      btns: [
        {
          id: 'cancel',
          label: '取消',
          class: '--border-gray-e5 --text-gray-666',
          type: 'cancel',
          isClose: true,
        },
        {
          id: 'back',
          label: '上一步',
          class: '--border-gray-e5 --text-gray-666',
          type: 'cancel',
          isClose: true,
        },
        {
          id: 'sure',
          label: '確定，套用範本',
          class: '--bg-green-6a2d --text-white',
          type: 'sure',
          isClose: true,
        },
      ],
    })

    if (isCheck) {
      return 'sure'
    }

    return item?.id ?? 'cancel' // 'back' | 'cancel'，由 onClick 決定退回哪一步
  }
  const onAutoRefreshTemplateRenewalPopup = async () => {
    const { isSure: isRenewal, item } = await onCustom({
      id: 'popupAutoRefreshTemplateRenewal',
      title: '請選擇額度',
      icon: 'icon_quota',
      btns: [
        {
          id: 'cancel',
          label: '取消',
          class: '--border-gray-e5 --text-gray-666',
          type: 'cancel',
          isClose: true,
        },
        {
          id: 'back',
          label: '上一步',
          class: '--border-gray-e5 --text-gray-666',
          type: 'cancel',
          isClose: true,
        },
        {
          id: 'sure',
          label: '確定，使用額度',
          class: '--bg-green-6a2d --text-white',
          type: 'sure',
          isClose: false,
        },
      ],
    })

    if (isRenewal) {
      return 'sure'
    }

    return item?.id ?? 'cancel' // 'back' | 'cancel'，由 onClick 決定退回哪一步
  }
  // 套用範本完整流程：選擇範本 → 確認範本時間 → 續約 → 儲存
  // 同時供「編輯」流程重新進入，避免回到選擇範本後無法繼續後續步驟
  const onAutoRefreshTemplateCount = () => {
    const { list, selectedIndex } = autoRefresh.value.templateSave
    const refreshCount = list?.[selectedIndex]?.refreshCount ?? 0
    const currentCount = autoRefresh.value.info?.currentCount ?? 0

    return refreshCount - currentCount
  }
  const onAutoRefreshTemplateFlow = async (update) => {
    if (update) autoRefreshTemplateUpdate = update // 保留首次進入流程帶入的頁面更新 callback

    autoRefresh.value.templateSave.apiData.hfID = autoRefresh.value.info?.hfID

    onResetPojectData('autoRefreshTemplate') // 清空 autoRefresh 選取的資料

    while (true) {
      // 選擇範本 popup（上一步會自行回到「自動刷新設定」）
      const isTemplate = await onAutoRefreshTemplatePopup(autoRefresh.value.info)
      if (!isTemplate) return

      // 確認範本時間 popup
      const check = await onAutoRefreshTemplateCheckPopup()
      if (check === 'back') continue // 上一步 → 回到選擇範本
      if (check !== 'sure') return // 取消 / 關閉 → 結束

      const count = onAutoRefreshTemplateCount()

      if (count === 0) {
        autoRefresh.value.templateSave.apiData.planID = 0 // 0 為覆蓋不是新增
      }

      // 續約 popup（次數不相同才需要選額度）
      if (count > 0) {
        onApiPromise('open')
        await onApiGETRefreshAvailablePlans()
        onApiPromise('close')

        const renewal = await onAutoRefreshTemplateRenewalPopup()
        if (renewal === 'back') continue // 上一步 → 回到選擇範本
        if (renewal !== 'sure') return // 取消 / 關閉 → 結束
      }

      break
    }

    onApiPromise('open')
    await onApiPOSTRefreshSavePlanTemplate()
    onApiPromise('close')

    await onAutoRefreshSuccess(autoRefreshTemplateUpdate)
  }
  const onAutoRefreshSuccessPopup = async () => {
    const { isSure } = await onCustom({
      id: 'popupAutoRefreshSuccess',
      title: '自動刷新',
      icon: 'icon_double_star',
      hasExistClose: false,
      btns: 'alert',
    })

    if (isSure) {
      return true
    }
  }
  // 顯示成功彈窗，確認後執行頁面更新
  const onAutoRefreshSuccess = async (update) => {
    const isSure = await onAutoRefreshSuccessPopup()

    if (!isSure) return

    onApiPromise('open')
    if (update) await update()
    onApiPromise('close')
  }

  const onResetPojectData = (type) => {
    if (type === 'renewal' || !type) {
      renewal.value.apiData.planID = null
    }

    if (type === 'golden' || !type) {
      golden.value.apiData.planID = null
    }

    if (type === 'autoRefresh' || !type) {
      autoRefresh.value.save.apiData.planID = null
      autoRefresh.value.save.apiData.listSelectedRefreshTime = []
    }

    if (type === 'autoRefreshTemplate' || !type) {
      autoRefresh.value.templateSave.selectedIndex = null
      autoRefresh.value.templateSave.apiData.templateID = null
      autoRefresh.value.templateSave.apiData.planID = null
      autoRefresh.value.templateSave.apiData.listSelectedRefreshTime = []
    }

    if (type === 'autoRefreshSaveTemplate' || !type) {
      autoRefresh.value.templateSaveTime.apiData.templateID = null
      autoRefresh.value.templateSaveTime.apiData.listSelectedRefreshTime = []
    }
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
    onApiGETRefreshNewPlan,
    onApiGETRefreshGetPlanInfo,
    onApiGETRefreshAvailablePlans,
    onApiPOSTRefreshSavePlan,
    onApiGETRefreshTemplateAvailableTemplates,
    onApiPOSTRefreshSavePlanTemplate,
    onApiGETRefreshTemplateGetTemplateInfo,
    onApiPOSTRefreshTemplateSaveTemplate,
    onGoldenPopup,
    onAutoRefreshPopup,
    onAutoRefreshAddTimePopup,
    onAutoRefreshRenewalPopup,
    onAutoRefreshTemplatePopup,
    onAutoRefreshTemplateCheckPopup,
    onAutoRefreshTemplateRenewalPopup,
    onAutoRefreshTemplateFlow,
    onAutoRefreshSuccessPopup,
    onAutoRefreshSuccess,
    onResetPojectData,
    onValueGetText,
    onReplaceImageSize,
  }
}
