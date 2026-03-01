import {
  apiGETRealEstate,
  apiPOSTRealEstateDraft,
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
} from '@js/buy/_api/index.js'

import { toFixed } from '@js/_prototype.js'

import { useBuyBasicStore } from '@stores/buy/basic.js'
import { useBuyProjectStore } from '@stores/buy/project.js'

const useStores = () => {
  const projectStores = useBuyProjectStore()
  const basicStores = useBuyBasicStore()
  const { apiData, options: projectOptions } = storeToRefs(projectStores)
  const { pingData } = storeToRefs(basicStores)

  const project = {
    async onApiGETRealEstatePurposeCheckOptions() {
      // const { public: env } = useRuntimeConfig()
      // const hfID = env.NUXT_PUBLIC_HFID_DEFAULT
      const { config, status, data } = await apiGETRealEstatePurposeCheckOptions()

      if (status === 200) {
        projectOptions.value.casePurpose = data || []
      }

      return { config, status, data }
    },
    async onApiGETCitySelectOptions() {
      const { config, status, data } = await apiGETCitySelectOptions()

      if (status === 200) {
        projectOptions.value.city = data || []
      }

      return { config, status, data }
    },
    async onApiGETDistrictSelectOptions(cityID) {
      const { config, status, data } = await apiGETDistrictSelectOptions({
        cityCode: cityID,
      })

      // if (status === 200) {
      //   console.log(data)
      // }

      return { config, status, data }
    },
    async onApiGETRoad(cityID, AreaID) {
      const { config, status, data } = await apiGETRoad({
        cityCode: cityID,
        districtCode: AreaID,
      })

      // if (status === 200) {
      //   console.log(data)
      // }

      return { config, status, data }
    },
    async onApiGETRealEstateTypeSelectOptions() {
      const { config, status, data } = await apiGETRealEstateTypeSelectOptions()

      if (status === 200) {
        projectOptions.value.caseType = data || []
      }

      return { config, status, data }
    },
    async onApiGETRealEstateLegalUsageSelectOptions() {
      const { config, status, data } = await apiGETRealEstateLegalUsageSelectOptions()

      if (status === 200) {
        projectOptions.value.caseUsage = data || []
      }

      return { config, status, data }
    },
    async onApiGETRealEstateZoingCheckOptions() {
      const { config, status, data } = await apiGETRealEstateZoingCheckOptions()

      if (status === 200) {
        projectOptions.value.caseZoing = data || []
      }

      return { config, status, data }
    },
    async onApiGETRealEstateZoingCitySelectOptions() {
      const { config, status, data } = await apiGETRealEstateZoingCitySelectOptions()

      if (status === 200) {
        projectOptions.value.zoingCity = data || []
      }

      return { config, status, data }
    },
    async onApiGETRealEstateZoingLandSelectOptions() {
      const { config, status, data } = await apiGETRealEstateZoingLandSelectOptions()

      if (status === 200) {
        projectOptions.value.zoingLand = data || []
      }

      return { config, status, data }
    },
    async onApiGETRealEstateAgeIdentifySelectOptions() {
      const { config, status, data } = await apiGETRealEstateAgeIdentifySelectOptions()

      if (status === 200) {
        projectOptions.value.ageIdentify = data || []
      }

      return { config, status, data }
    },
    async onApiGETRealEstateFloorSelectOptions() {
      const { config, status, data } = await apiGETRealEstateFloorSelectOptions()

      if (status === 200) {
        projectOptions.value.floor = data || []
      }

      return { config, status, data }
    },
    async onApiGETRealEstateFaceSelectOptions() {
      const { config, status, data } = await apiGETRealEstateFaceSelectOptions()

      if (status === 200) {
        projectOptions.value.face = data || []
      }

      return { config, status, data }
    },
    async onApiGETRealEstateStructionSelectOptions() {
      const { config, status, data } = await apiGETRealEstateStructionSelectOptions()

      if (status === 200) {
        projectOptions.value.structure = data || []
      }

      return { config, status, data }
    },
    async onApiGETRealEstateBarrierFreeCheckOptions() {
      const { config, status, data } = await apiGETRealEstateBarrierFreeCheckOptions()

      if (status === 200) {
        projectOptions.value.barrierFree = data || []
      }

      return { config, status, data }
    },
    async onApiGETRealEstateManageTypeSelectOptions() {
      const { config, status, data } = await apiGETRealEstateManageTypeSelectOptions()

      if (status === 200) {
        projectOptions.value.manageType = data || []
      }

      return { config, status, data }
    },
    async onApiGETRealEstateManageDutySelectOptions() {
      const { config, status, data } = await apiGETRealEstateManageDutySelectOptions()

      if (status === 200) {
        projectOptions.value.manageDuty = data || []
      }

      return { config, status, data }
    },
    async onApiGETRealEstateManagePayPeriodSelectOptions() {
      const { config, status, data } = await apiGETRealEstateManagePayPeriodSelectOptions()

      if (status === 200) {
        projectOptions.value.managePay = data || []
      }

      return { config, status, data }
    },
    async onApiGETRealEstateParkingModeSelectOptions() {
      const { config, status, data } = await apiGETRealEstateParkingModeSelectOptions()

      if (status === 200) {
        projectOptions.value.parkingMode = data || []
      }

      return { config, status, data }
    },
    async onApiGETRealEstateParkingTypeSelectOptions() {
      const { config, status, data } = await apiGETRealEstateParkingTypeSelectOptions()

      if (status === 200) {
        projectOptions.value.parkingType = data || []
      }

      return { config, status, data }
    },
    async onApiGETRealEstateParkingRegSelectOptions() {
      const { config, status, data } = await apiGETRealEstateParkingRegSelectOptions()

      if (status === 200) {
        projectOptions.value.parkingReg = data || []
      }

      return { config, status, data }
    },
    async onApiGETRealEstateParkingPayPeriodSelectOptions() {
      const { config, status, data } = await apiGETRealEstateParkingPayPeriodSelectOptions()

      if (status === 200) {
        projectOptions.value.parkingPayPeriod = data || []
      }

      return { config, status, data }
    },
    async onApiGETRealEstateVideoDisplaySelectOptions() {
      const { config, status, data } = await apiGETRealEstateVideoDisplaySelectOptions()

      if (status === 200) {
        projectOptions.value.videoDisplay = data || []
      }

      return { config, status, data }
    },
    async onApiGETRealEstateVideoTypeSelectOptions() {
      const { config, status, data } = await apiGETRealEstateVideoTypeSelectOptions()

      if (status === 200) {
        projectOptions.value.videoType = data || []
      }

      return { config, status, data }
    },
    async onApiGETRealEstateFeatureCheckOptions() {
      const { config, status, data } = await apiGETRealEstateFeatureCheckOptions()

      if (status === 200) {
        projectOptions.value.feature = data || []
      }

      return { config, status, data }
    },
    async onApiGETRealEstatePosterDataSourceSelectOptions() {
      const { config, status, data } = await apiGETRealEstatePosterDataSourceSelectOptions()

      if (status === 200) {
        projectOptions.value.posterDataSource = data || []
      }

      return { config, status, data }
    },
  }
  const basic = {
    currentUnit: computed(() =>
      basicStores.options.unit.find((item) => item.value === apiData.value.isCaseSqUnitPin)
    ),
    pingUnitLabel: computed(
      () =>
        basicStores.options.unit.find((item) => item.value === apiData.value.isCaseSqUnitPin).label
    ),
    onPingVaild() {
      const { isCaseBuildSqIncludeParking } = apiData.value
      const { caseBuildSq, caseParkingSq, caseMainSq } = pingData.value
      const caseBuildSqNumber = caseBuildSq || 0
      const caseParkingSqNumber = caseParkingSq || 0
      const caseMainSqNumber = caseMainSq || 0
      const build = isCaseBuildSqIncludeParking
        ? caseBuildSqNumber - caseParkingSqNumber
        : caseBuildSqNumber

      // 登記坪數
      return build >= caseMainSqNumber
    },
    onPingUnitChange() {
      const unit = basic.currentUnit.value
      const isPin = unit.id === 'pin'
      const isSqMeters = unit.id === 'sqMeters'

      if (!unit) return

      Object.keys(pingData.value).forEach((key) => {
        const pinKey = `${key}Pin`
        const mKey = `${key}M`
        const val = pingData.value[key]

        if (val !== '' && !isNaN(Number(val))) {
          pingData.value[key] = isPin
            ? apiData.value[pinKey]
            : isSqMeters
              ? apiData.value[mKey]
              : ''
        }
      })
    },
    onPinSqMetersConvert(key) {
      const val = pingData.value[key]
      const unit = basic.currentUnit.value
      if (!unit || !val) return

      const pinKey = `${key}Pin`
      const mKey = `${key}M`
      const isPin = unit.id === 'pin'
      const isSqMeters = unit.id === 'sqMeters'
      const pinConf = basicStores.options.unit.find((u) => u.id === 'pin')
      const mConf = basicStores.options.unit.find((u) => u.id === 'sqMeters')
      const onConvert = (value, conf) => Number(toFixed(Number(value) * conf.convert, conf.toFixed))

      if (!pinConf || !mConf) return

      apiData.value[pinKey] = isPin ? Number(val) : onConvert(val, pinConf)
      apiData.value[mKey] = isSqMeters ? Number(val) : onConvert(val, mConf)

      console.log(apiData.value[pinKey])
      console.log(apiData.value[mKey])
    },
    async onApiGETRealEstate(hfid) {
      const { config, status, data } = await apiGETRealEstate({
        hfid: hfid,
        caseInfo: apiData.value,
      })

      if (status === 200) {
        const { caseInfo } = data

        apiData.value = caseInfo
      }

      return { config, status, data }
    },
    async onApiPOSTRealEstateDraft(hfid) {
      const { config, status, data } = await apiPOSTRealEstateDraft({
        hfid: hfid,
        caseInfo: apiData.value,
      })

      if (status === 200) {
      }

      return { config, status, data }
    },
    async onApiPOSTRealEstate(hfid) {
      const { config, status, data } = await apiPOSTRealEstate({
        hfid: hfid,
        caseInfo: apiData.value,
      })

      if (status === 200) {
      }

      return { config, status, data }
    },
  }

  return {
    project,
    basic,
  }
}

export default useStores
