import {
  apiGetCommonServerTime,
  apiGetBuyCitySelectOptions,
  apiGetBuyCityCodeDistrictSelectOptions,
  apiGetVasPublishAvailablePlans,
  apiPostVasPublishSubmit,
  apiPostBuyRealEstateRestoreToOnline,
  apiPostVasPublishRenewal,
  apiGetVasPublishGetPublishResponse,
  apiGetVasGoldenGetPlanList,
  apiPostVasGoldenSetPlanSingle,
  apiGetVasRefreshCurrentPlansForCase,
  apiGetVasRefreshNewPlan,
  apiGetVasRefreshGetPlanInfo,
  apiGetVasRefreshAvailablePlans,
  apiPostVasRefreshSavePlan,
  apiGetVasRefreshTemplateAvailableTemplates,
  apiPostVasRefreshSavePlanTemplate,
  apiGetVasRefreshTemplateGetTemplateInfo,
  apiPostVasRefreshTemplateSaveTemplate,
} from '@js/_api/buy/common.js'

import {
  apiGetBuyRealEstatePurposeCheckOptions,
  apiGetBuyCityCodeDistrictCodeRoad,
  apiGetBuyRealEstateTypeSelectOptions,
  apiGetBuyRealEstateLegalUsageSelectOptions,
  apiGetBuyRealEstateZoingCheckOptions,
  apiGetBuyRealEstateZoingCitySelectOptions,
  apiGetBuyRealEstateZoingLandSelectOptions,
  apiGetBuyRealEstateAgeIdentifySelectOptions,
  apiGetBuyRealEstateFloorSelectOptions,
  apiGetBuyCommunities,
  apiGetBuyRealEstateFaceSelectOptions,
  apiGetBuyRealEstateStructionSelectOptions,
  apiGetBuyRealEstateBarrierFreeCheckOptions,
  apiGetBuyRealEstateManageTypeSelectOptions,
  apiGetBuyRealEstateManageDutySelectOptions,
  apiGetBuyRealEstateManagePayPeriodSelectOptions,
  apiGetBuyRealEstateParkingModeSelectOptions,
  apiGetBuyRealEstateParkingTypeSelectOptions,
  apiGetBuyRealEstateParkingRegSelectOptions,
  apiGetBuyRealEstateParkingPayPeriodSelectOptions,
  apiGetBuyRealEstateVideoDisplaySelectOptions,
  apiGetBuyRealEstateVideoTypeSelectOptions,
  apiGetBuyRealEstateFeatureCheckOptions,
  apiGetBuyRealEstatePosterDataSourceSelectOptions,
} from '@js/_api/buy/publish.js'

import { onFormatDate } from '@js/_prototype.js'

import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyPublishStore } from '@stores/buy/publish.js'

import usePopupActions from '@stores/.composables/usePopupActions.js'

// 套用範本流程的頁面更新 callback。「編輯」按鈕位於全域 popup 內無法透過 props 取得 update，
// 故以模組層級保存，讓編輯後重新進入流程仍能於成功後刷新頁面。
let autoRefreshTemplateUpdate = null

export default () => {
  const projectStores = useBuyProjectStore()
  const { onAlert, onCustom, onApiPromise, onApiError } = usePopupActions()
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

  const onApiGetBuyRealEstatePurposeCheckOptions = async () => {
    if (options.value.casePurpose) return false

    const { config, status, data } = await apiGetBuyRealEstatePurposeCheckOptions()

    if (status === 200) {
      options.value.casePurpose = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetBuyCitySelectOptions = async () => {
    if (options.value.city) return false

    const { config, status, data } = await apiGetBuyCitySelectOptions()

    if (status === 200) {
      options.value.city = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetBuyCityCodeDistrictSelectOptions = async (cityID) => {
    const { config, status, data } = await apiGetBuyCityCodeDistrictSelectOptions({
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
  const onApiGetBuyCityCodeDistrictCodeRoad = async (cityID, AreaID) => {
    const { config, status, data } = await apiGetBuyCityCodeDistrictCodeRoad({
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
  const onApiGetBuyRealEstateTypeSelectOptions = async () => {
    const { casePurposeToken } = apiData.value.caseInfo

    const { config, status, data } = await apiGetBuyRealEstateTypeSelectOptions({
      purposeToken: casePurposeToken,
    })

    if (status === 200) {
      options.value.caseType = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetBuyRealEstateLegalUsageSelectOptions = async () => {
    const { casePurposeToken } = apiData.value.caseInfo

    const { config, status, data } = await apiGetBuyRealEstateLegalUsageSelectOptions({
      purposeToken: casePurposeToken,
    })

    if (status === 200) {
      options.value.caseUsage = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetBuyRealEstateZoingCheckOptions = async () => {
    if (options.value.caseZoing) return false

    const { config, status, data } = await apiGetBuyRealEstateZoingCheckOptions()

    if (status === 200) {
      options.value.caseZoing = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetBuyRealEstateZoingCitySelectOptions = async () => {
    if (options.value.zoingCity) return false

    const { config, status, data } = await apiGetBuyRealEstateZoingCitySelectOptions()

    if (status === 200) {
      options.value.zoingCity = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetBuyRealEstateZoingLandSelectOptions = async () => {
    if (options.value.zoingLand) return false

    const { config, status, data } = await apiGetBuyRealEstateZoingLandSelectOptions()

    if (status === 200) {
      options.value.zoingLand = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetBuyRealEstateAgeIdentifySelectOptions = async () => {
    if (options.value.ageIdentify) return false

    const { config, status, data } = await apiGetBuyRealEstateAgeIdentifySelectOptions()

    if (status === 200) {
      options.value.ageIdentify = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetBuyRealEstateFloorSelectOptions = async () => {
    if (options.value.floor) return false

    const { config, status, data } = await apiGetBuyRealEstateFloorSelectOptions()

    if (status === 200) {
      options.value.floor = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetBuyCommunities = async (params) => {
    const { config, status, data } = await apiGetBuyCommunities(params)

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetBuyRealEstateFaceSelectOptions = async () => {
    if (options.value.face) return false

    const { config, status, data } = await apiGetBuyRealEstateFaceSelectOptions()

    if (status === 200) {
      options.value.face = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetBuyRealEstateStructionSelectOptions = async () => {
    if (options.value.structure) return false

    const { config, status, data } = await apiGetBuyRealEstateStructionSelectOptions()

    if (status === 200) {
      options.value.structure = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetBuyRealEstateBarrierFreeCheckOptions = async () => {
    if (options.value.barrierFree) return false

    const { config, status, data } = await apiGetBuyRealEstateBarrierFreeCheckOptions()

    if (status === 200) {
      options.value.barrierFree = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetBuyRealEstateManageTypeSelectOptions = async () => {
    if (options.value.manageType) return false

    const { config, status, data } = await apiGetBuyRealEstateManageTypeSelectOptions()

    if (status === 200) {
      options.value.manageType = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetBuyRealEstateManageDutySelectOptions = async () => {
    if (options.value.manageDuty) return false

    const { config, status, data } = await apiGetBuyRealEstateManageDutySelectOptions()

    if (status === 200) {
      options.value.manageDuty = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetBuyRealEstateManagePayPeriodSelectOptions = async () => {
    if (options.value.managePay) return false

    const { config, status, data } = await apiGetBuyRealEstateManagePayPeriodSelectOptions()

    if (status === 200) {
      options.value.managePay = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetBuyRealEstateParkingModeSelectOptions = async () => {
    if (options.value.parkingMode) return false

    const { config, status, data } = await apiGetBuyRealEstateParkingModeSelectOptions()

    if (status === 200) {
      options.value.parkingMode = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetBuyRealEstateParkingTypeSelectOptions = async () => {
    if (options.value.parkingType) return false

    const { config, status, data } = await apiGetBuyRealEstateParkingTypeSelectOptions()

    if (status === 200) {
      options.value.parkingType = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetBuyRealEstateParkingRegSelectOptions = async () => {
    if (options.value.parkingReg) return false

    const { config, status, data } = await apiGetBuyRealEstateParkingRegSelectOptions()

    if (status === 200) {
      options.value.parkingReg = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetBuyRealEstateParkingPayPeriodSelectOptions = async () => {
    if (options.value.parkingPayPeriod) return false

    const { config, status, data } = await apiGetBuyRealEstateParkingPayPeriodSelectOptions()

    if (status === 200) {
      options.value.parkingPayPeriod = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetBuyRealEstateVideoDisplaySelectOptions = async () => {
    if (options.value.videoDisplay) return false

    const { config, status, data } = await apiGetBuyRealEstateVideoDisplaySelectOptions()

    if (status === 200) {
      options.value.videoDisplay = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetBuyRealEstateVideoTypeSelectOptions = async () => {
    if (options.value.videoType) return false

    const { config, status, data } = await apiGetBuyRealEstateVideoTypeSelectOptions()

    if (status === 200) {
      options.value.videoType = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetBuyRealEstateFeatureCheckOptions = async () => {
    const { casePurposeToken } = apiData.value.caseInfo
    const { config, status, data } = await apiGetBuyRealEstateFeatureCheckOptions({
      purposeToken: casePurposeToken,
    })

    if (status === 200) {
      options.value.feature = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetBuyRealEstatePosterDataSourceSelectOptions = async () => {
    if (options.value.posterDataSource) return false

    const { config, status, data } = await apiGetBuyRealEstatePosterDataSourceSelectOptions()

    if (status === 200) {
      options.value.posterDataSource = data || []
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetVasPublishAvailablePlans = async (hfID) => {
    const { config, status, data } = await apiGetVasPublishAvailablePlans({
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
  const onApiPostVasPublishRenewal = async (hfIDs) => {
    const { config, status, data } = await apiPostVasPublishRenewal({
      userID: 0,
      hfIDs,
      ...renewal.value.apiData,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiPostVasPublishSubmit = async (hfIDs) => {
    const { config, status, data } = await apiPostVasPublishSubmit({
      userID: 0,
      hfIDs,
      ...renewal.value.apiData,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiPostBuyRealEstateRestoreToOnline = async (hfIDs) => {
    const { config, status, data } = await apiPostBuyRealEstateRestoreToOnline({
      hfIDs,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetVasPublishGetPublishResponse = async (hfID) => {
    const { config, status, data } = await apiGetVasPublishGetPublishResponse({
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
  const onApiGetVasGoldenGetPlanList = async () => {
    const { config, status, data } = await apiGetVasGoldenGetPlanList()

    if (status === 200) {
      golden.value.plans = data
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiPostVasGoldenSetPlanSingle = async (hfID) => {
    const { config, status, data } = await apiPostVasGoldenSetPlanSingle({
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
  const onApiGetVasRefreshCurrentPlansForCase = async (hfID) => {
    const { config, status, data } = await apiGetVasRefreshCurrentPlansForCase({
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
  const onApiGetVasRefreshNewPlan = async (hfID) => {
    const { config, status, data } = await apiGetVasRefreshNewPlan({
      userId: 0,
      hfID,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetVasRefreshGetPlanInfo = async () => {
    const { hfID, vasID } = autoRefresh.value.save.apiData
    const { config, status, data } = await apiGetVasRefreshGetPlanInfo({
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
  const onApiGetVasRefreshAvailablePlans = async () => {
    const { hfID, listSelectedRefreshTime } = autoRefresh.value.save.apiData
    const { config, status, data } = await apiGetVasRefreshAvailablePlans({
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
  const onApiPostVasRefreshSavePlan = async () => {
    const { config, status, data } = await apiPostVasRefreshSavePlan({
      userID: 0,
      ...autoRefresh.value.save.apiData,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetVasRefreshTemplateAvailableTemplates = async (hfID) => {
    const { config, status, data } = await apiGetVasRefreshTemplateAvailableTemplates({
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
  const onApiPostVasRefreshSavePlanTemplate = async () => {
    const { config, status, data } = await apiPostVasRefreshSavePlanTemplate({
      userID: 0,
      ...autoRefresh.value.templateSave.apiData,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetVasRefreshTemplateGetTemplateInfo = async () => {
    const { config, status, data } = await apiGetVasRefreshTemplateGetTemplateInfo({
      userId: 0,
      ...autoRefresh.value.templateSaveTime.apiData,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  const onApiPostVasRefreshTemplateSaveTemplate = async () => {
    const { config, status, data } = await apiPostVasRefreshTemplateSaveTemplate(
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
      const { status } = await onApiPostVasGoldenSetPlanSingle(objectData.hfID)

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
    const { status } = await onApiGetVasRefreshCurrentPlansForCase(objectData.hfID)

    onApiPromise('close')

    if (status === 200) {
      /*
       * 封面圖沿用列表帶進來的那張。
       *
       * ⚠️ RefreshCurrentPlansForCase 的回應沒有 picURLCover,而自動刷新流程
       * 後續的每個燈箱(設定 / 選範本 / 確認)都是拿 autoRefresh.info 當物件
       * 資料 —— 不補的話那些燈箱的封面圖全是空的。
       *
       * 補在這裡而不是燈箱內:上面那支 API 會整個覆寫 autoRefresh.info,
       * 只能等它寫完再補。而且一定要在 status === 200 之後 —— API 失敗時
       * info 還是上一個物件的殘值,補上去會變成張冠李戴。
       *
       * 列表的網址已經過 onReplaceImageSize 換掉 {0} / {1} 尺寸佔位符,
       * 直接沿用即可。這支也會被「從子燈箱返回」呼叫,那時 objectData 就是
       * info 自己,沒有 picURLCover 也不會把已經補好的值蓋掉。
       */
      if (objectData?.picURLCover && autoRefresh.value.info) {
        autoRefresh.value.info.picURLCover = objectData.picURLCover
      }

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
    const { status, data } = await onApiGetVasRefreshNewPlan(objectData.hfID)

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
      /*
       * 這個燈箱本來就渲染 PageBuyPublishInfo,只是一直沒收到資料 ——
       * data 沒傳時 publishInfo 是 null,v-if 讓整塊靜靜消失,所以不會破版,
       * 也就一直沒被發現。
       *
       * 這裡讀 autoRefresh.info 是安全的:流程上一步的「增加刷新次數」燈箱
       * 已經在用同一份 info,而 onResetPojectData 只清 save.apiData,不碰 info。
       */
      data: autoRefresh.value.info,
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

    const { status } = await onApiGetVasRefreshTemplateAvailableTemplates(objectData.hfID)

    onApiPromise('close')

    if (status === 200) {
      const { isSure: isListTemplate, item } = await onCustom({
        id: 'popupAutoRefreshTemplate',
        title: '請選擇範本',
        icon: 'icon_copy',
        /*
         * ⚠️ 這裡要傳物件資料,不是上面那支 API 的回應。
         *
         * 燈箱頂端的 PageBuyPublishInfo 從 customData.data 取 caseTitle /
         * caseAddr / picURLCover 等欄位;傳範本清單進來的話,那幾個欄位一個都
         * 對不到,照片與標題就整塊空白。
         * 範本清單本身不必經由這裡 —— onApiGetVasRefreshTemplateAvailableTemplates
         * 已經寫進 autoRefresh.templateSave.list,燈箱是從 store 讀的。
         */
        data: objectData,
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
      /* 同 onAutoRefreshRenewalPopup —— 範本流程的上一步也是拿這份 info */
      data: autoRefresh.value.info,
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
        await onApiGetVasRefreshAvailablePlans()
        onApiPromise('close')

        const renewal = await onAutoRefreshTemplateRenewalPopup()
        if (renewal === 'back') continue // 上一步 → 回到選擇範本
        if (renewal !== 'sure') return // 取消 / 關閉 → 結束
      }

      break
    }

    onApiPromise('open')
    await onApiPostVasRefreshSavePlanTemplate()
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
    onApiGetBuyRealEstatePurposeCheckOptions,
    onApiGetBuyCitySelectOptions,
    onApiGetBuyCityCodeDistrictSelectOptions,
    onApiGetBuyCityCodeDistrictCodeRoad,
    onApiGetBuyRealEstateTypeSelectOptions,
    onApiGetBuyRealEstateLegalUsageSelectOptions,
    onApiGetBuyRealEstateZoingCheckOptions,
    onApiGetBuyRealEstateZoingCitySelectOptions,
    onApiGetBuyRealEstateZoingLandSelectOptions,
    onApiGetBuyRealEstateAgeIdentifySelectOptions,
    onApiGetBuyRealEstateFloorSelectOptions,
    onApiGetBuyCommunities,
    onApiGetBuyRealEstateFaceSelectOptions,
    onApiGetBuyRealEstateStructionSelectOptions,
    onApiGetBuyRealEstateBarrierFreeCheckOptions,
    onApiGetBuyRealEstateManageTypeSelectOptions,
    onApiGetBuyRealEstateManageDutySelectOptions,
    onApiGetBuyRealEstateManagePayPeriodSelectOptions,
    onApiGetBuyRealEstateParkingModeSelectOptions,
    onApiGetBuyRealEstateParkingTypeSelectOptions,
    onApiGetBuyRealEstateParkingRegSelectOptions,
    onApiGetBuyRealEstateParkingPayPeriodSelectOptions,
    onApiGetBuyRealEstateVideoDisplaySelectOptions,
    onApiGetBuyRealEstateVideoTypeSelectOptions,
    onApiGetBuyRealEstateFeatureCheckOptions,
    onApiGetBuyRealEstatePosterDataSourceSelectOptions,
    onApiGetVasPublishAvailablePlans,
    onApiPostVasPublishRenewal,
    onApiPostVasPublishSubmit,
    onApiPostBuyRealEstateRestoreToOnline,
    onApiGetVasPublishGetPublishResponse,
    onApiGetVasGoldenGetPlanList,
    onApiPostVasGoldenSetPlanSingle,
    onApiGetVasRefreshCurrentPlansForCase,
    onApiGetVasRefreshNewPlan,
    onApiGetVasRefreshGetPlanInfo,
    onApiGetVasRefreshAvailablePlans,
    onApiPostVasRefreshSavePlan,
    onApiGetVasRefreshTemplateAvailableTemplates,
    onApiPostVasRefreshSavePlanTemplate,
    onApiGetVasRefreshTemplateGetTemplateInfo,
    onApiPostVasRefreshTemplateSaveTemplate,
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
