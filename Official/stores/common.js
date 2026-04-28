import { defineStore } from 'pinia'

export const useCommonStore = defineStore('common', () => {
  const isLoading = ref(false)

  return {
    isLoading,
  }
})
