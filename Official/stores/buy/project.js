import { defineStore } from 'pinia'

export const useBuyProjectStore = defineStore('buyProject', () => {
  const NAME = '好房網 買屋'
  const serverTime = ref(null)
  const options = ref({
    casePurpose: null,
    caseType: null,
    face: null,
    parkingMode: null,
    nearBy: null,
    features: null,
  })

  return {
    NAME,
    serverTime,
    options,
  }
})
