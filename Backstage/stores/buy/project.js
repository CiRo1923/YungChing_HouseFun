import { defineStore } from 'pinia'

export const useBuyProjectStore = defineStore('buyProject', () => {
  const NAME = '好房網買屋 Housefun 管理後台'
  const serverTime = ref(null)
  const renewal = ref({
    data: null,
    apiData: {
      planID: null,
    },
  })
  const autoRefresh = ref({
    data: null,
    info: null,
    plans: null,
    availableInfo: null,
    availablePlans: null,
    save: {
      apiData: {
        hfID: null,
        vasID: null,
        planID: null,
        empID: null,
        listSelectedRefreshTime: [],
      },
    },
  })
  const golden = ref({
    plans: null,
    apiData: {
      planID: null,
      empID: null,
    },
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
    serverTime,
    renewal,
    golden,
    autoRefresh,
    options,
    parkingInfo,
  }
})
