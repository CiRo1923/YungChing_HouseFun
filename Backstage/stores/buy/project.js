import { onDeepClone } from '@js/_prototype.js'

export const useBuyProjectStore = defineStore('buyProject', () => {
  const NAME = '好房網買屋 Housefun 管理後台'
  const apiDefault = readonly({
    renewal: {
      planID: null,
    },
    autoRefreshSave: {
      hfID: null,
      vasID: null,
      planID: null,
      empID: null,
      listSelectedRefreshTime: [],
    },
    autoRefreshTemplateSaveTime: {
      templateID: null,
      isCustom: null,
      templateName: null,
      listSelectedRefreshTime: [],
    },
    autoRefreshTemplateSave: {
      hfID: null,
      templateID: null,
      planID: null,
      isCustom: false,
      empID: null,
      listSelectedRefreshTime: [],
    },
    golden: {
      planID: null,
      empID: null,
    },
  })
  const serverTime = ref(null)
  const renewal = ref({
    data: null,
    apiData: onDeepClone(apiDefault.renewal),
  })
  const autoRefresh = ref({
    data: null,
    info: null,
    plans: null,
    availableInfo: null,
    availablePlans: null,
    save: {
      apiData: onDeepClone(apiDefault.autoRefreshSave),
    },
    templateSaveTime: {
      apiData: onDeepClone(apiDefault.autoRefreshTemplateSaveTime),
    },
    templateSave: {
      info: null,
      list: null,
      selectedIndex: null,
      apiData: onDeepClone(apiDefault.autoRefreshTemplateSave),
    },
  })
  const golden = ref({
    plans: null,
    apiData: onDeepClone(apiDefault.golden),
  })
  const options = ref({
    casePurpose: null,
    city: null,
    area: null,
    caseType: null,
    caseUsage: null,
    caseZoing: null,
    zoingCity: null,
    zoingLand: null,
    ageIdentify: null,
    floor: null,
    face: null,
    structure: null,
    barrierFree: null,
    manageType: null,
    manageDuty: null,
    managePay: null,
    parkingMode: null,
    parkingType: null,
    parkingReg: null,
    parkingPayPeriod: null,
    videoDisplay: null,
    videoType: null,
    feature: null,
    posterDataSource: null,
  })
  const parkingInfo = readonly({
    parkingID: null,
    caseParkingModeToken: null,
    caseParkingModeOther: null,
    caseParkingCount: null,
    caseParkingTypeToken: null,
    caseParkingTypeOther: null,
    caseParkingRegToken: null,
    caseParkingRegOther: null,
    caseParkingFeePayTypeToken: null,
    caseParkingFee: null,
    isCaseParkingFeeInclude: true,
  })

  return {
    NAME,
    apiDefault,
    serverTime,
    renewal,
    golden,
    autoRefresh,
    options,
    parkingInfo,
  }
})
