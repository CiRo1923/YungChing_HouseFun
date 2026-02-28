import { defineStore } from 'pinia'

export const useBuyBasicStore = defineStore('buyBasic', () => {
  const options = readonly({
    unit: [
      {
        id: 'pin',
        label: '坪',
        value: true,
        convert: 3.30579, // 1 坪 = 3.30579 平方公尺,
        toFixed: 2,
      },
      {
        id: 'sqMeters',
        label: '平方公尺',
        value: false,
        convert: 0.3025, // 1 平方公尺 = 0.3025 坪
        toFixed: 2,
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

  return {
    options,
    pingData,
  }
})
