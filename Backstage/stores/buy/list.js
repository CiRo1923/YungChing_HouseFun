import { defineStore } from 'pinia'

export const useBuyListStore = defineStore('buyList', () => {
  const apiData = ref({
    caseBarrierfreeToken: [],
    cityToken: 0,
    caseDownToken: 0,
    caseDealShowToken: 0,
    districtToken: [],
    exchangeToken: 0,
    goldenToken: 0,
    listSortToken: 0,
    listOrderToken: 1,
    pinToken: 0,
    pinRangeMin: null,
    pinRangeMax: null,
    priceToken: 0,
    priceRangeMin: null,
    priceRangeMax: null,
    searchKey: '',
    roomCountToken: 0,
    roomRangeMin: null,
    roomRangeMax: null,
  })
  const apiDealData = ref({
    dateDeal: null,
    isDealShow: false,
  })
  const datas = ref(null)

  return {
    apiData,
    apiDealData,
    datas,
  }
})
