import { defineStore } from 'pinia'

export const useManageStore = defineStore('manage', () => {
  const options = ref({
    city: null,
    area: null,
    casePurpose: null,
    caseType: null,
    face: null,
    parkingMode: null,
    nearBy: null,
    features: null,
    branch: null,
    branchStore: null,
  })

  return {
    options,
  }
})
