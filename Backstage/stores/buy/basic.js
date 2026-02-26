import { toFixed } from '@js/_prototype.js'

import { useBuyProjectStore } from '@stores/buy/project.js'

import { defineStore } from 'pinia'

export const useBuyBasicStore = defineStore('buyBasic', () => {
  const pingUnit = ref('pin')
  const options = readonly({
    unit: [
      {
        label: '坪',
        value: 'pin',
        convert: 3.30579, // 1 坪 = 3.30579 平方公尺,
        toFixed: 2,
      },
      {
        label: '平方公尺',
        value: 'sqMeters',
        convert: 0.3025, // 1 平方公尺 = 0.3025 坪
        toFixed: 4,
      },
    ],
  })
  const pingData = ref({
    caseBuildSq: '',
    caseParkingSq: '',
    caseMainSq: '',
    caseAffiliatedSq: '',
    caseBalconySq: '',
    casePlatformSq: '',
    caseTerraceSq: '',
    caseStairwellSq: '',
    caseMezzanineSq: '',
    caseBasementSq: '',
    caseOtherSq: '',
    caseAmenitieSq: '',
    caseLandSq: '',
  })
  const pingUnitLabel = computed(
    () => options.unit.find((item) => item.value === pingUnit.value).label
  )
  const onPingUnitChange = () => {
    const currentUnit = options.unit.find((u) => u.value === pingUnit.value)
    if (!currentUnit) return

    Object.keys(pingData.value).forEach((key) => {
      const val = pingData.value[key]

      if (val !== '' && !isNaN(Number(val))) {
        pingData.value[key] = String(
          Number(toFixed(Number(val) * currentUnit.convert, currentUnit.toFixed))
        )
      }
    })
  }
  const onPinSqMetersConvert = () => {
    // console.log('change')
    const buyProject = useBuyProjectStore()
    const { apiData } = storeToRefs(buyProject)

    // console.log(apiData.value)
  }

  return {
    pingUnit,
    options,
    pingData,
    pingUnitLabel,
    onPingUnitChange,
    onPinSqMetersConvert,
  }
})
