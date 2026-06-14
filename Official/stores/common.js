import { defineStore } from 'pinia'

export const useCommonStore = defineStore('common', () => {
  const isLoading = ref(false)
  const device = ref('p')

  return {
    isLoading,
    device,
  }
})
