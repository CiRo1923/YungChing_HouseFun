import { defineStore } from 'pinia'

export const useBuyProjectStore = defineStore('buyProject', () => {
  const NAME = '好房網 買屋'
  const options = ref({
    casePurpose: null,
    caseType: null,
    face: null,
    parkingMode: null,
    nearBy: null,
  })

  return {
    NAME,
    options,
  }
})
