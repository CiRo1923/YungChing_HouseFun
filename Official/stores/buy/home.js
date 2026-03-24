import { defineStore } from 'pinia'

export const useHomeStore = defineStore('hoem', () => {
  const content = ref(null)
  const info = ref({
    active: 0,
    items: [
      {
        id: 'all',
        label: '全部 ({{ value }})',
        value: 0,
      },
      {
        id: 'priceDrop',
        label: '七天內降價 ({{ value }})',
        value: 1,
      },
      {
        id: 'new',
        label: '兩周內上架 ({{ value }})',
        value: 2,
      },
      {
        id: 'vr',
        label: 'VR ({{ value }})',
        value: 3,
      },
    ],
  })
  const mode = ref('list')
  const pagination = ref(null)

  return {
    content,
    info,
    mode,
    pagination,
  }
})
