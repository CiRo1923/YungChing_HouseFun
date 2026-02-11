import { defineStore } from 'pinia'

export const rentProjectStore = defineStore('rentProject', () => {
  const NAME = '好房網快租 Housefun'

  return {
    NAME
  }
})