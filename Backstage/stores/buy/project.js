import { defineStore } from 'pinia'

export const useBuyProjectStore = defineStore('buyProject', () => {
  const NAME = '好房網買屋 Housefun 管理後台'

  return {
    NAME,
  }
})
