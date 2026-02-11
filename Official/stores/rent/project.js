import { defineStore } from 'pinia'

export const projectStore = defineStore('project', () => {
  const NAME = '好房網快租 Housefun'

  return {
    NAME
  }
})