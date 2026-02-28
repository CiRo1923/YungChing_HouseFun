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
  apiGETRealEstateFloorSelectOptions,
  apiGETRealEstateFaceSelectOptions,
  apiGETRealEstateStructionSelectOptions,
  apiGETRealEstateBarrierFreeCheckOptions,
  apiGETRealEstateManageTypeSelectOpstions,
  apiGETRealEstateManageDutySelectOpstions,
  apiGETRealEstateManagePayPeriodSelectOpstions,
  apiGETRealEstateParkingModeSelectOptions,
  apiGETRealEstateParkingTypeSelectOpstions,
  apiGETRealEstateParkingRegSelectOpstions,
  apiGETRealEstateParkingPayPeriodSelectOpstions,
  apiGETRealEstateVideoTypeSelectOpstions,
  apiGETRealEstateFeatureCheckOptions,
} from '@js/buy/_api/index.js'

import { toFixed } from '@js/_prototype.js'

import { useBuyBasicStore } from '@stores/buy/basic.js'
import { useBuyProjectStore } from '@stores/buy/project.js'

const useStores = () => {
  const projectStores = useBuyProjectStore()
  const basicStores = useBuyBasicStore()
  const { apiData, options: projectOptions } = storeToRefs(projectStores)
  const { pingData, currentUnit } = storeToRefs(basicStores)
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
    onApiGETDistrictSelectOptions: async (cityID) => {
      const { config, status, data } = await apiGETDistrictSelectOptions({
        cityCode: cityID,
      })

      // if (status === 200) {
      //   console.log(data)
      // }

      return { config, status, data }
    },
    onApiGETRoad: async (cityID, AreaID) => {
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
        apiData.value.caseZoingToken = data[0].code
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
    async onApiGETRealEstateFloorSelectOptions() {
      const { config, status, data } = await apiGETRealEstateFloorSelectOptions()

      if (status === 200) {
        projectOptions.value.floor = data || []
        apiData.value.floorFromToken = data[0].value
        apiData.value.floorToToken = data[0].value
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
    async onApiGETRealEstateManageTypeSelectOpstions() {
      const { config, status, data } = await apiGETRealEstateManageTypeSelectOpstions()

      if (status === 200) {
        projectOptions.value.manageType = data || []
      }

      return { config, status, data }
    },
    async onApiGETRealEstateManageDutySelectOpstions() {
      const { config, status, data } = await apiGETRealEstateManageDutySelectOpstions()

      if (status === 200) {
        projectOptions.value.manageDuty = data || []
      }

      return { config, status, data }
    },
    async onApiGETRealEstateManagePayPeriodSelectOpstions() {
      const { config, status, data } = await apiGETRealEstateManagePayPeriodSelectOpstions()

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
    async onApiGETRealEstateParkingTypeSelectOpstions() {
      const { config, status, data } = await apiGETRealEstateParkingTypeSelectOpstions()

      if (status === 200) {
        projectOptions.value.parkingType = data || []
      }

      return { config, status, data }
    },
    async onApiGETRealEstateParkingRegSelectOpstions() {
      const { config, status, data } = await apiGETRealEstateParkingRegSelectOpstions()

      if (status === 200) {
        projectOptions.value.parkingReg = data || []
      }

      return { config, status, data }
    },
    async onApiGETRealEstateParkingPayPeriodSelectOpstions() {
      const { config, status, data } = await apiGETRealEstateParkingPayPeriodSelectOpstions()

      if (status === 200) {
        projectOptions.value.parkingPayPeriod = data || []
      }

      return { config, status, data }
    },
    async onApiGETRealEstateVideoTypeSelectOpstions() {
      const { config, status, data } = await apiGETRealEstateVideoTypeSelectOpstions()

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
  }
  const basic = {
    onPingUnitChange: () => {
      const unit = currentUnit.value
      const isPin = unit.value === 'pin'
      const isSqMeters = unit.value === 'sqMeters'

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
    onPinSqMetersConvert: (key) => {
      const val = pingData.value[key]
      const unit = currentUnit.value
      if (!unit || !val) return

      const pinKey = `${key}Pin`
      const mKey = `${key}M`
      const isPin = unit.value === 'pin'
      const isSqMeters = unit.value === 'sqMeters'
      const pinConf = basicStores.options.unit.find((u) => u.value === 'pin')
      const mConf = basicStores.options.unit.find((u) => u.value === 'sqMeters')
      const onConvert = (value, conf) =>
        String(Number(toFixed(Number(value) * conf.convert, conf.toFixed)))

      if (!pinConf || !mConf) return

      apiData.value[pinKey] = isPin ? val : onConvert(val, pinConf)
      apiData.value[mKey] = isSqMeters ? val : onConvert(val, mConf)

      // console.log(apiData.value[pinKey])
      // console.log(apiData.value[mKey])
    },
    async onApiGETRealEstate(hfid) {
      const { config, status, data } = await apiGETRealEstate({
        hfid: hfid,
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
      })

      if (status === 200) {
      }

      return { config, status, data }
    },
    async onApiPOSTRealEstate(hfid) {
      const { config, status, data } = await apiPOSTRealEstate({
        hfid: hfid,
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
