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
  apiGETRealEstateFloorSelectOptions,
  apiGETRealEstateFaceSelectOptions,
  apiGETRealEstateStructionSelectOptions,
  apiGETRealEstateBarrierFreeCheckOptions,
  apiGETRealEstateManageTypeSelectOpstions,
  apiGETRealEstateManageDutySelectOpstions,
  apiGETRealEstateManagePayPeriodSelectOpstions,
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
    onApiGETRealEstatePurposeCheckOptions: async () => {
      // const { public: env } = useRuntimeConfig()
      // const hfID = env.NUXT_PUBLIC_HFID_DEFAULT
      const { config, status, data } = await apiGETRealEstatePurposeCheckOptions()

      if (status === 200) {
        projectOptions.value.casePurpose = data || []
      }

      return { config, status, data }
    },
    onApiGETCitySelectOptions: async () => {
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
    onApiGETRealEstateTypeSelectOptions: async () => {
      const { config, status, data } = await apiGETRealEstateTypeSelectOptions()

      if (status === 200) {
        projectOptions.value.caseType = data || []
      }

      return { config, status, data }
    },
    onApiGETRealEstateLegalUsageSelectOptions: async () => {
      const { config, status, data } = await apiGETRealEstateLegalUsageSelectOptions()

      if (status === 200) {
        projectOptions.value.caseUsage = data || []
      }

      return { config, status, data }
    },
    onApiGETRealEstateZoingCheckOptions: async () => {
      const { config, status, data } = await apiGETRealEstateZoingCheckOptions()

      if (status === 200) {
        projectOptions.value.caseZoing = data || []
        apiData.value.caseZoingToken = data[0].code
      }

      return { config, status, data }
    },
    onApiGETRealEstateZoingCitySelectOptions: async () => {
      const { config, status, data } = await apiGETRealEstateZoingCitySelectOptions()

      if (status === 200) {
        projectOptions.value.zoingCity = data || []
      }

      return { config, status, data }
    },
    onApiGETRealEstateZoingLandSelectOptions: async () => {
      const { config, status, data } = await apiGETRealEstateZoingLandSelectOptions()

      if (status === 200) {
        projectOptions.value.zoingLand = data || []
      }

      return { config, status, data }
    },
    onApiGETRealEstateFloorSelectOptions: async () => {
      const { config, status, data } = await apiGETRealEstateFloorSelectOptions()

      if (status === 200) {
        projectOptions.value.floor = data || []
        apiData.value.floorFromToken = data[0].value
        apiData.value.floorToToken = data[0].value
      }

      return { config, status, data }
    },
    onApiGETRealEstateFaceSelectOptions: async () => {
      const { config, status, data } = await apiGETRealEstateFaceSelectOptions()

      if (status === 200) {
        projectOptions.value.face = data || []
      }

      return { config, status, data }
    },
    onApiGETRealEstateStructionSelectOptions: async () => {
      const { config, status, data } = await apiGETRealEstateStructionSelectOptions()

      if (status === 200) {
        projectOptions.value.structure = data || []
      }

      return { config, status, data }
    },
    onApiGETRealEstateBarrierFreeCheckOptions: async () => {
      const { config, status, data } = await apiGETRealEstateBarrierFreeCheckOptions()

      if (status === 200) {
        projectOptions.value.barrierFree = data || []
      }

      return { config, status, data }
    },
    onApiGETRealEstateManageTypeSelectOpstions: async () => {
      const { config, status, data } = await apiGETRealEstateManageTypeSelectOpstions()

      if (status === 200) {
        projectOptions.value.manageType = data || []
      }

      return { config, status, data }
    },
    onApiGETRealEstateManageDutySelectOpstions: async () => {
      const { config, status, data } = await apiGETRealEstateManageDutySelectOpstions()

      if (status === 200) {
        projectOptions.value.manageDuty = data || []
      }

      return { config, status, data }
    },
    onApiGETRealEstateManagePayPeriodSelectOpstions: async () => {
      const { config, status, data } = await apiGETRealEstateManagePayPeriodSelectOpstions()

      if (status === 200) {
        projectOptions.value.managePay = data || []
      }

      return { config, status, data }
    },
    onApiGETRealEstateVideoTypeSelectOpstions: async () => {
      const { config, status, data } = await apiGETRealEstateVideoTypeSelectOpstions()

      if (status === 200) {
        projectOptions.value.videoType = data || []
      }

      return { config, status, data }
    },
    onApiGETRealEstateFeatureCheckOptions: async () => {
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

      console.log(apiData.value[pinKey])
      console.log(apiData.value[mKey])
    },
  }

  return {
    project,
    basic,
  }
}

export default useStores
