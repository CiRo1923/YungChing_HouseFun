import { defineStore } from 'pinia'

export const useBuyListStore = defineStore('buyList', () => {
  const basicRouteName = 'buy-list-filters'
  const channel = ref('region')
  const content = ref(null)
  const apiSearchData = ref({
    purpose: '',
    price: '',
    room: '',
    addRoom: false,
    type: '',
    buildpin: '',
    usepin: '',
    landpin: '',
    npark: false,
    parking: '',
    age: '',
    floor: '',
    uniprice: '',
    dt: '',
    tab: 0,
    tag: [],
    kw: '',
    od: '',
  })
  const region = ref({
    defaultIDs: '01',
    label: '',
    ids: '',
    all: '',
    options: null,
  })
  const mrt = ref({
    defaultIDs: '0102',
    label: '',
    ids: '',
    all: '',
    options: null,
  })
  const purpose = ref({
    defaultLabel: {
      pt: '用途不限',
      m: '用途',
    },
    label: '',
  })
  const price = ref({
    defaultLabel: {
      pt: '總價不限',
      m: '總價',
    },
    label: '',
    unit: '萬',
    range: [],
    min: null,
    max: null,
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
    unit: '房',
    range: [],
    min: null,
    max: null,
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
  const type = ref({
    defaultLabel: '型態不限',
    label: '',
  })
  const pin = ref({
    defaultLabel: '坪數不限',
    label: '',
    unit: '坪',
    type: 'buildpin',
    min: null,
    max: null,
    options: [
      {
        label: '不限',
        value: '',
      },
      {
        label: '20 坪以下',
        value: '-20',
      },
      {
        label: '20 - 30 坪',
        value: '20-30',
      },
      {
        label: '30 - 40 坪',
        value: '30-40',
      },
      {
        label: '40 - 60 坪',
        value: '40-60',
      },
      {
        label: '60 - 100 坪',
        value: '60-100',
      },
      {
        label: '100 坪以上',
        value: '100-',
      },
    ],
  })
  const parking = ref({
    defaultLabel: '車位不限',
    label: '',
  })
  const age = ref({
    defaultLabel: '屋齡不限',
    label: '',
    unit: '年',
    min: null,
    max: null,
    options: [
      {
        label: '不限',
        value: '',
      },
      {
        label: '預售屋',
        value: '0-0',
      },
      {
        label: '1 年以下',
        value: '-1',
      },
      {
        label: '1 - 5 年',
        value: '1-5',
      },
      {
        label: '6 - 10 年',
        value: '6-10',
      },
      {
        label: '11 - 20 年',
        value: '11-20',
      },
      {
        label: '21 - 30 年',
        value: '21-30',
      },
      {
        label: '30 年以上',
        value: '30-',
      },
    ],
  })
  const floor = ref({
    defaultLabel: '樓層不限',
    label: '',
    unit: '樓',
    min: null,
    max: null,
    options: [
      {
        label: '不限',
        value: '',
      },
      {
        label: '1 樓',
        value: '1',
      },
      {
        label: '2 - 5 樓',
        value: '2-5',
      },
      {
        label: '6 - 12 年',
        value: '6-12',
      },
      {
        label: '12 樓以上',
        value: '12-',
      },
    ],
  })
  const unitPrice = ref({
    defaultLabel: '單價不限',
    label: '',
    unit: '萬 / 坪',
    min: null,
    max: null,
    options: [
      {
        label: '不限',
        value: '',
      },
      {
        label: '40 萬 / 坪以下',
        value: '-40',
      },
      {
        label: '40 - 60 萬 / 坪',
        value: '40-60',
      },
      {
        label: '60 - 80 萬 / 坪',
        value: '60-80',
      },
      {
        label: '80 萬 / 坪以上',
        value: '80-',
      },
    ],
  })
  const face = ref({
    defaultLabel: '朝向不限',
    label: '',
  })
  const nearBy = ref({
    defaultLabel: '環境不限',
    label: '',
  })
  const more = ref({
    defaultLabel: {
      pt: '更多條件',
      m: '更多',
    },
    label: '',
    options: [
      {
        id: 'type',
        label: '型態',
      },
      {
        id: 'pin',
        label: '坪數',
      },
      {
        id: 'parking',
        label: '車位 ',
      },
      {
        id: 'age',
        label: '屋齡 ',
      },
      {
        id: 'floor',
        label: '樓層',
      },
      {
        id: 'unitPrice',
        label: '單價',
      },
      {
        id: 'face',
        label: '朝向',
      },
      {
        id: 'nearBy',
        label: '環境',
      },
    ],
  })
  const tab = ref({
    defaultID: 0,
    options: [
      {
        id: 'all',
        label: '全部',
        count: 0,
        value: 0,
      },
      {
        id: 'priceDrop',
        label: {
          pt: '最近降價',
          m: '降價',
        },
        count: 0,
        value: 1,
      },
      {
        id: 'new',
        label: '新上架',
        count: 0,
        value: 2,
      },
      {
        id: 'vr',
        label: '實境找房',
        count: 0,
        value: 3,
      },
    ],
  })
  const pagination = ref({
    page: 1,
    pageSize: 12,
    total: 0,
  })

  return {
    basicRouteName,
    channel,
    apiSearchData,
    content,
    region,
    mrt,
    purpose,
    price,
    repayment,
    room,
    type,
    pin,
    parking,
    age,
    floor,
    unitPrice,
    face,
    nearBy,
    more,
    tab,
    pagination,
  }
})
