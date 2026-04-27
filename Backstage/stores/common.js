import { defineStore } from 'pinia'

export const useCommonStore = defineStore('common', () => {
  const isLoading = ref(false)

  const onIsLoading = (boolean) => {
    isLoading.value = boolean
  }

  const onWithLoadingAll = async (promises) => {
    if (import.meta.client) {
      onIsLoading(true)
    }

    try {
      return await Promise.all(promises)
    } finally {
      if (import.meta.client) {
        onIsLoading(false)
      }
    }
  }

  const onReset = () => {
    onIsLoading(false)
  }

  return {
    isLoading,
    onIsLoading,
    onWithLoadingAll,
    onReset,
  }
})
