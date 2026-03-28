import { defineStore } from 'pinia'

export const useHomeStore = defineStore('hoem', () => {
  const content = ref(null)
  const region = ref(null)
  const mrt = ref(null)
  const purpose = ref({
    value: '',
    label: '用途不限',
  })
  const price = ref({
    value: '',
    label: '總價不限',
    options: [
      {
        label: '不限',
        value: '',
      },
      {
        label: '1000 萬以下',
        value: 0,
      },
      {
        label: '1000 - 1500 萬',
        value: 1500,
      },
      {
        label: '1500 - 2000 萬',
        value: 2000,
      },
      {
        label: '2000 - 3000 萬',
        value: 3000,
      },
      {
        label: '3000 - 4000 萬',
        value: 4000,
      },
      {
        label: '4000 - 6000 萬',
        value: 6000,
      },
      {
        label: '6000 萬以上',
        value: 6001,
      },
    ],
  })
  const room = ref({
    value: '',
    label: '格局不限',
    hasAddon: false,
    options: [
      {
        label: '不限',
        value: '',
      },
      {
        label: '1 房 (含套房)',
        value: 1,
      },
      {
        label: '2 房',
        value: 2,
      },
      {
        label: '3 房',
        value: 3,
      },
      {
        label: '4 房',
        value: 4,
      },
      {
        label: '5 房',
        value: 5,
      },
    ],
  })
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
  const pagination = ref({
    page: 1,
    pageSize: 12,
    total: 0,
  })

  return {
    content,
    region,
    mrt,
    purpose,
    price,
    room,
    info,
    mode,
    pagination,
  }
})
