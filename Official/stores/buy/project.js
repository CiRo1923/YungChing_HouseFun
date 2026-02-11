import { defineStore } from 'pinia'

export const projectStore = defineStore('project', () => {
  const NAME = '好房網買屋 Housefun'

  return {
    NAME
  }
})