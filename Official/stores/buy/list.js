import { defineStore } from 'pinia'

export const useBuyListStore = defineStore('list', () => {
  const basicRouteName = 'buy-list-filters'
  const channel = ref('region')
  const content = ref(null)
  const region = ref({
    defaultApiData: '01',
    label: '',
    apiData: '',
    all: '',
    options: null,
  })
  const mrt = ref({
    defaultApiData: '0102',
    label: '',
    apiData: '',
    all: '',
    options: null,
  })
  const purpose = ref({
    defaultLabel: '用途不限',
    label: '',
    apiData: '',
  })
  const price = ref({
    defaultLabel: '總價不限',
    label: '',
    apiData: '',
    model: [],
    maxPrice: null,
    minPrice: null,
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
  const repayment = ref({
    downPayment: null,
    monthlyPayment: null,
    loanYears: 30,
    annualInterestRate: null,
  })
  const room = ref({
    defaultLabel: '格局不限',
    label: '',
    apiData: '',
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
  const keyword = ref(null)
  const tab = ref({
    defaultApiData: 0,
    apiData: null,
    options: [
      {
        id: 'all',
        label: {
          pt: '全部 ({{ value }})',
          m: '全部',
        },
        value: 0,
      },
      {
        id: 'priceDrop',
        label: {
          pt: '七天內降價 ({{ value }})',
          m: '降價',
        },
        value: 1,
      },
      {
        id: 'new',
        label: {
          pt: '兩周內上架 ({{ value }})',
          m: '新上架',
        },
        value: 2,
      },
      {
        id: 'vr',
        label: {
          pt: 'VR ({{ value }})',
          m: 'VR',
        },
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
    basicRouteName,
    channel,
    content,
    region,
    mrt,
    purpose,
    price,
    repayment,
    room,
    keyword,
    tab,
    mode,
    pagination,
  }
})
