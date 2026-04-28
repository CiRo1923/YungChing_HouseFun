import {
  apiPOSTRealEstateNewCase,
  apiGETRealEstate,
  apiPOSTRealEstate,
  apiPOSTRealEstateDraft,
  apiPOSTRealEstatePicUpload,
} from '@js/_api/buy/index.js'

import { onToFixed } from '@js/_prototype.js'

import { useBuyBasicStore } from '@stores/buy/basic.js'

import useBuyProjectActions from '@stores/buy/_composables/useProjectActions.js'
import useBuyPopupActions from '@stores/buy/_composables/usePopupActions.js'

const useBuyBasicActions = () => {
  const {
    onApiGETRealEstatePurposeCheckOptions,
    onApiGETCitySelectOptions,
    onApiGETRealEstateTypeSelectOptions,
    onApiGETRealEstateLegalUsageSelectOptions,
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
    onApiGETRealEstateFeatureCheckOptions,
    onApiGETRealEstatePosterDataSourceSelectOptions,
  } = useBuyProjectActions()
  const basicStores = useBuyBasicStore()
  const { onApiError } = useBuyPopupActions()
  const { apiData, pingData } = storeToRefs(basicStores)
  const currentUnit = computed(() =>
    basicStores.options.unit.find((item) => item.value === apiData.value.caseInfo.isCaseSqUnitPin)
  )
  const pingUnitLabel = computed(
    () =>
      basicStores.options.unit.find((item) => item.value === apiData.value.caseInfo.isCaseSqUnitPin)
        .label
  )
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
    const pinConf = basicStores.options.unit.find((u) => u.id === 'pin')
    const mConf = basicStores.options.unit.find((u) => u.id === 'sqMeters')
    const onConvert = (value, conf) => Number(onToFixed(Number(value) * conf.convert, conf.toFixed))

    if (!pinConf || !mConf) return

    apiData.value.caseInfo[pinKey] = isPin ? Number(val) : onConvert(val, pinConf)
    apiData.value.caseInfo[mKey] = isSqMeters ? Number(val) : onConvert(val, mConf)

    console.log(apiData.value.caseInfo[pinKey])
    console.log(apiData.value.caseInfo[mKey])
  }
  const onApiPOSTRealEstateNewCase = async () => {
    const { config, status, data } = await apiPOSTRealEstateNewCase({
      caseType: 4, //  (1:直營, 2:加盟, 3:複製, 4:B端)
    })

    if (status === 200) {
      console.log(data)
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRealEstate = async (hfid) => {
    const { config, status, data } = await apiGETRealEstate({
      hfid: hfid,
    })

    if (status === 200) {
      const { caseInfo } = data

      apiData.value.caseInfo = caseInfo
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiPOSTRealEstateDraft = async (hfid) => {
    const { config, status, data } = await apiPOSTRealEstateDraft({
      hfid: hfid,
      ...apiData.value,
    })

    if (status === 200) {
      console.log(data)
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiPOSTRealEstate = async (hfid) => {
    const { config, status, data } = await apiPOSTRealEstate({
      hfid: hfid,
      ...apiData.value,
    })

    if (status === 200) {
      console.log(data)
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
  const onAllPromise = () => {
    return [
      useAsyncData('purpose-options', () => onApiGETRealEstatePurposeCheckOptions()),
      useAsyncData('city-options', () => onApiGETCitySelectOptions()),
      useAsyncData('type-options', () => onApiGETRealEstateTypeSelectOptions()),
      useAsyncData('usage-options', () => onApiGETRealEstateLegalUsageSelectOptions()),
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
      useAsyncData('feature-options', () => onApiGETRealEstateFeatureCheckOptions()),
      useAsyncData('posterDataSource-options', () =>
        onApiGETRealEstatePosterDataSourceSelectOptions()
      ),
    ]
  }

  return {
    currentUnit,
    pingUnitLabel,
    onPingVaild,
    onPingUnitChange,
    onPinSqMetersConvert,
    onApiPOSTRealEstateNewCase,
    onApiGETRealEstate,
    onApiPOSTRealEstateDraft,
    onApiPOSTRealEstate,
    onApiPOSTRealEstatePicUpload,
    onAllPromise,
  }
}

export default useBuyBasicActions
