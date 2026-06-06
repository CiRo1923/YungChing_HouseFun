import { defineStore } from 'pinia'

export const useBuyListStore = defineStore('buyList', () => {
  const apiSearchDataDefault = readonly({
    searchKey: '',
    purposeToken: '0', // '0' 為不限
    exchangeToken: '0', // '0' 為不限
    goldenToken: '0', // '0' 為不限
    roomCountToken: '0', // '0' 為不限
    roomRangeMin: null,
    roomRangeMax: null,
    priceToken: '0', // '0' 為不限
    priceRangeMin: null,
    priceRangeMax: null,
    pinToken: '0', // '0' 為不限
    pinRangeMin: null,
    pinRangeMax: null,
    cityToken: 0, // 0 為不限
    districtToken: [],
    caseDownToken: 0,
    caseDealShowToken: 0,
    listSortToken: 0, // 0 為不限
    listOrderToken: 2,
  })
  const apiCommentsDefault = readonly({
    hfID: null,
    searchKey: null,
    statueToken: '0', // '0' 為不限
    caseCommentTypeToken: '0', // '0' 為不限
    page: 1,
  })
  const apiSearchData = ref({ ...apiSearchDataDefault })
  const apiDealData = ref({
    dateDeal: null,
    isDealShow: false,
  })
  const apiCommentsData = ref({ ...apiCommentsDefault })
  const apiCommentUpdateData = ref({
    commentIDList: [],
    isReply: null, // 1: 已回覆, 2: 未回覆
  })
  const serachOptions = ref({
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
  const commentsOptions = ref({
    status: null,
    type: null,
  })
  const planAggregate = ref(null)
  const aggregate = ref(null)
  const searchDatas = ref(null)
  const commentsDatas = ref(null)
  const searchPagination = ref(null)
  const commentsPagination = ref(null)

  return {
    apiSearchDataDefault,
    apiCommentsDefault,
    apiSearchData,
    apiDealData,
    apiCommentsData,
    apiCommentUpdateData,
    serachOptions,
    commentsOptions,
    planAggregate,
    aggregate,
    searchDatas,
    commentsDatas,
    searchPagination,
    commentsPagination,
  }
})
