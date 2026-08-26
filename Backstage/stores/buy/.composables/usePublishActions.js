import {
  apiPOSTRealEstateNewCase,
  apiGETRealEstate,
  apiPOSTRealEstate,
  apiPOSTRealEstateDraft,
  apiPOSTRealEstatePicUpload,
  apiPOSTRealEstateReadToPublish,
  apiGERealEstateCaseStatus,
} from '@js/_api/buy/publish.js'

import { onToFixed } from '@js/_prototype.js'

import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyPublishStore } from '@stores/buy/publish.js'

import useBuyProjectActions from '@stores/buy/.composables/useProjectActions.js'
import usePopupActions from '@stores/.composables/usePopupActions.js'

export default () => {
  const buyProject = useBuyProjectStore()
  const { options } = storeToRefs(buyProject)
  const {
    onApiGETRealEstatePurposeCheckOptions,
    onApiGETCitySelectOptions,
    onApiGETRealEstateZoingCheckOptions,
    onApiGETRealEstateZoingCitySelectOptions,
    onApiGETRealEstateZoingLandSelectOptions,
    onApiGETRealEstateAgeIdentifySelectOptions,
    onApiGETRealEstateFloorSelectOptions,
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
    onApiGETRealEstatePosterDataSourceSelectOptions,
    onValueGetText,
    onReplaceImageSize,
  } = useBuyProjectActions()
  const publishStores = useBuyPublishStore()
  const { apiData, statusData, pingData } = storeToRefs(publishStores)
  const { onAlert, onConfirm, onApiError } = usePopupActions()
  const currentUnit = computed(() =>
    publishStores.options.unit.find((item) => item.value === apiData.value.caseInfo.isCaseSqUnitPin)
  )
  const pingUnitLabel = computed(
    () =>
      publishStores.options.unit.find(
        (item) => item.value === apiData.value.caseInfo.isCaseSqUnitPin
      ).label
  )
  // 離開頁面前,若表單有未儲存的變更就先問過使用者。
  //
  // dirty 用「快照比對」判定,不用 vee-validate 的 meta.dirty:後者只認得註冊成 Field 的欄位,
  // 照片、地圖帶回的地址、CKEditor 這些改了不算數。
  //
  // 用法:資料載入完成後呼叫一次 onSnapshotSave() 當基準;每次儲存成功後再呼叫一次重設。
  //   const { onSnapshotSave } = onUnsavedChanges(() => apiData.value)
  const onUnsavedChanges = (getState) => {
    const snapshot = ref(null)
    const onSerialize = () => JSON.stringify(toValue(getState) ?? null)

    // 建立 / 重設基準。沒呼叫過就不會攔截,避免資料還沒載入完就誤判成有變更
    const onSnapshotSave = () => {
      snapshot.value = onSerialize()
    }

    const isDirty = () => {
      if (snapshot.value === null) return false

      return snapshot.value !== onSerialize()
    }

    // 涵蓋瀏覽器上一頁與應用內導航(返回 / 取消按鈕)。
    // 關閉分頁與重整要用 beforeunload,但那無法自訂文案,不在此處理。
    onBeforeRouteLeave(async () => {
      if (!isDirty()) return true

      const { isSure } = await onConfirm({
        title: '尚未儲存',
        content: '您有未儲存的變更，如果現在離開，剛剛輸入的資料將不會被保留。',
      })

      return isSure
    })

    return {
      onSnapshotSave,
      isDirty,
    }
  }
  // 一律以表單當前值組地址。
  // ⚠ 不要回頭讀 address(地圖定位的回傳):那是一次性的填入來源,填完就該由表單接手。
  //   以前只要定位過一次就永遠回傳那份快照,之後在表單改路段,顯示不會跟著變。
  const onAddress = () => {
    const caseInfo = apiData.value.caseInfo
    const cityID = caseInfo.cityID ? String(caseInfo.cityID) : ''
    const districtID = caseInfo.districtID ? String(caseInfo.districtID) : ''
    const city = onValueGetText('city', cityID).text
    const area = onValueGetText('area', districtID).text
    const lane = caseInfo.lane ? `${caseInfo.lane}巷` : ''
    const alley = caseInfo.alley ? `${caseInfo.alley}弄` : ''
    const number = caseInfo.addrNum ? `${caseInfo.addrNum}號` : ''
    const ofNumber = caseInfo.addrNumOf ? `之${caseInfo.addrNumOf}` : ''

    return [city, area, caseInfo.road, lane, alley, number, ofNumber].filter(Boolean).join('')
  }
  const onPingVaild = () => {
    const { isCaseBuildSqIncludeParking } = apiData.value.caseInfo
    const { caseBuildSq, caseParkingSq, caseMainSq } = pingData.value
    const caseBuildSqNumber = caseBuildSq || 0
    const caseParkingSqNumber = caseParkingSq || 0
    const caseMainSqNumber = caseMainSq || 0
    const build = isCaseBuildSqIncludeParking
      ? caseBuildSqNumber - caseParkingSqNumber
      : caseBuildSqNumber

    // 登記坪數
    return build >= caseMainSqNumber
  }
  const onPingUnitChange = () => {
    const unit = currentUnit.value
    const isPin = unit.id === 'pin'
    const isSqMeters = unit.id === 'sqMeters'

    if (!unit) return

    Object.keys(pingData.value).forEach((key) => {
      const pinKey = `${key}Pin`
      const mKey = `${key}M`
      const val = pingData.value[key]

      if (val !== '' && !isNaN(Number(val))) {
        pingData.value[key] = isPin
          ? apiData.value.caseInfo[pinKey]
          : isSqMeters
            ? apiData.value.caseInfo[mKey]
            : ''
      }
    })
  }
  const onPinSqMetersConvert = (key) => {
    const val = pingData.value[key]
    const unit = currentUnit.value
    if (!unit || !val) return

    const pinKey = `${key}Pin`
    const mKey = `${key}M`
    const isPin = unit.id === 'pin'
    const isSqMeters = unit.id === 'sqMeters'
    const pinConf = publishStores.options.unit.find((u) => u.id === 'pin')
    const mConf = publishStores.options.unit.find((u) => u.id === 'sqMeters')
    const onConvert = (value, conf) => Number(onToFixed(Number(value) * conf.convert, conf.toFixed))

    if (!pinConf || !mConf) return

    apiData.value.caseInfo[pinKey] = isPin ? Number(val) : onConvert(val, pinConf)
    apiData.value.caseInfo[mKey] = isSqMeters ? Number(val) : onConvert(val, mConf)

    // console.log(apiData.value.caseInfo[pinKey])
    // console.log(apiData.value.caseInfo[mKey])
  }
  const onApiPOSTRealEstateNewCase = async () => {
    const { config, status, data } = await apiPOSTRealEstateNewCase({
      caseType: 4, //  (1:直營, 2:加盟, 3:複製, 4:B端)
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRealEstate = async (hfID) => {
    const { config, status, data } = await apiGETRealEstate({
      hfID,
    })

    if (status === 200) {
      const { caseInfo, caseAddrDistrictOptions } = data
      const hasArea = caseAddrDistrictOptions?.length !== 0
      const isCaseSqUnitPin = caseInfo.isCaseSqUnitPin
      const imageSize = {
        width: 400,
        height: 304,
      }
      const fields = [
        'caseBuildSq',
        'caseParkingSq',
        'caseMainSq',
        'caseAffiliatedSq',
        'caseBalconySq',
        'casePlatformSq',
        'caseTerraceSq',
        'caseStairwellSq',
        'caseMezzanineSq',
        'caseBasementSq',
        'caseOtherSq',
        'caseAmenitieSq',
        'caseLandSq',
      ]
      const layoutFields = [
        'caseRoom',
        'caseLivingRoom',
        'caseBathroom',
        'caseBalcony',
        'caseAddRoom',
        'caseAddLivingRoom',
        'caseAddBathroom',
        'caseAddBalcony',
        'caseElevatorCount',
      ]

      const casePictures = onReplaceImageSize(caseInfo.casePictures, 'url', imageSize)
      const caseLayout = onReplaceImageSize(caseInfo.caseLayout, 'url', imageSize)

      apiData.value.caseInfo = caseInfo

      layoutFields.forEach((key) => {
        apiData.value.caseInfo[key] = caseInfo[key] || null
      })

      apiData.value.caseInfo.casePictures = casePictures // 替換 width  & height
      apiData.value.caseInfo.caseLayout = caseLayout // 替換 width  & height
      fields.forEach((key) => {
        pingData.value[key] = isCaseSqUnitPin ? caseInfo[`${key}Pin`] : caseInfo[`${key}M`]
      })

      if (hasArea) {
        options.value.area = caseAddrDistrictOptions
      }

      console.log(apiData.value.caseInfo)

      // console.log(data)
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiPOSTRealEstateDraft = async (hfID) => {
    const { config, status, data } = await apiPOSTRealEstateDraft({
      hfID,
      ...apiData.value,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiPOSTRealEstate = async (hfID) => {
    const { config, status, data } = await apiPOSTRealEstate({
      hfID,
      ...apiData.value,
    })

    if (status === 200) {
      onAlert({
        content: '儲存成功',
      })
      // console.log(data)
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiPOSTRealEstatePicUpload = async (params) => {
    const { config, status, data } = await apiPOSTRealEstatePicUpload(params)

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiPOSTRealEstateReadToPublish = async (hfID) => {
    const { config, status, data } = await apiPOSTRealEstateReadToPublish({
      hfID,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGERealEstateCaseStatus = async (hfID) => {
    const { config, status, data } = await apiGERealEstateCaseStatus({
      hfID,
    })

    if (status === 200) {
      statusData.value = data
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onAllPromise = () => {
    return [
      useAsyncData('purpose-options', () => onApiGETRealEstatePurposeCheckOptions()),
      useAsyncData('city-options', () => onApiGETCitySelectOptions()),
      useAsyncData('zoing-options', () => onApiGETRealEstateZoingCheckOptions()),
      useAsyncData('zoingCity-options', () => onApiGETRealEstateZoingCitySelectOptions()),
      useAsyncData('zoingLand-options', () => onApiGETRealEstateZoingLandSelectOptions()),
      useAsyncData('ageIdentify-options', () => onApiGETRealEstateAgeIdentifySelectOptions()),
      useAsyncData('floor-options', () => onApiGETRealEstateFloorSelectOptions()),
      useAsyncData('face-options', () => onApiGETRealEstateFaceSelectOptions()),
      useAsyncData('structure-options', () => onApiGETRealEstateStructionSelectOptions()),
      useAsyncData('barrierFree-options', () => onApiGETRealEstateBarrierFreeCheckOptions()),
      useAsyncData('manageType-options', () => onApiGETRealEstateManageTypeSelectOptions()),
      useAsyncData('manageDuty-options', () => onApiGETRealEstateManageDutySelectOptions()),
      useAsyncData('managePay-options', () => onApiGETRealEstateManagePayPeriodSelectOptions()),
      useAsyncData('parkingMode-options', () => onApiGETRealEstateParkingModeSelectOptions()),
      useAsyncData('parkingType-options', () => onApiGETRealEstateParkingTypeSelectOptions()),
      useAsyncData('parkingReg-options', () => onApiGETRealEstateParkingRegSelectOptions()),
      useAsyncData('parkingPayPeriod-options', () =>
        onApiGETRealEstateParkingPayPeriodSelectOptions()
      ),
      useAsyncData('videoDisplay-options', () => onApiGETRealEstateVideoDisplaySelectOptions()),
      useAsyncData('videoType-options', () => onApiGETRealEstateVideoTypeSelectOptions()),
      // useAsyncData('feature-options', () => onApiGETRealEstateFeatureCheckOptions()),
      useAsyncData('posterDataSource-options', () =>
        onApiGETRealEstatePosterDataSourceSelectOptions()
      ),
    ]
  }

  return {
    currentUnit,
    pingUnitLabel,
    onUnsavedChanges,
    onAddress,
    onPingVaild,
    onPingUnitChange,
    onPinSqMetersConvert,
    onApiPOSTRealEstateNewCase,
    onApiGETRealEstate,
    onApiPOSTRealEstateDraft,
    onApiPOSTRealEstate,
    onApiPOSTRealEstatePicUpload,
    onApiPOSTRealEstateReadToPublish,
    onApiGERealEstateCaseStatus,
    onAllPromise,
  }
}
