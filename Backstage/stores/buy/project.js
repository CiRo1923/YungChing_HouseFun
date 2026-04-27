import { defineStore } from 'pinia'

export const useBuyProjectStore = defineStore('buyProject', () => {
  const NAME = '好房網買屋 Housefun 管理後台'
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
    caseParkingCount: null,
    caseParkingTypeToken: null,
    caseParkingRegToken: null,
    caseParkingFeePayTypeToken: null,
    caseParkingFee: null,
    isCaseParkingFeeInclude: true,
  })

  return {
    NAME,
    options,
    parkingInfo,
  }
})
