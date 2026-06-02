import { defineStore } from 'pinia'

export const useBuyListStore = defineStore('buyList', () => {
  const apiSearchDataDefault = readonly({
    searchKey: '',
    purposeToken: '0',
    exchangeToken: '0',
    goldenToken: '0',
    roomCountToken: '0',
    roomRangeMin: null,
    roomRangeMax: null,
    priceToken: '0',
    priceRangeMin: null,
    priceRangeMax: null,
    pinToken: '0',
    pinRangeMin: null,
    pinRangeMax: null,
    cityToken: 0,
    districtToken: [],
    caseDownToken: 0,
    caseDealShowToken: 0,
    listSortToken: 0,
    listOrderToken: 2,
  })
  const apiSearchData = ref({ ...apiSearchDataDefault })
  const apiDealData = ref({
    dateDeal: null,
    isDealShow: false,
  })
  const options = ref({
    purpose: null,
    area: null,
    exchange: null,
    golden: null,
    room: null,
    price: null,
    pin: null,
    down: null,
    dealShow: null,
  })
  const planAggregate = ref(null)
  const aggregate = ref(null)
  const datas = ref(null)
  const pagination = ref(null)

  return {
    apiSearchDataDefault,
    apiSearchData,
    apiDealData,
    options,
    planAggregate,
    aggregate,
    datas,
    pagination,
  }
})
