import { defineStore } from 'pinia'

export const useHomeStore = defineStore('hoem', () => {
  const content = ref(null)
  const pagination = ref(null)

  return {
    content,
    pagination,
  }
})
