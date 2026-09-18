<script setup>
import { awaitAllPromise } from '@js/_prototype.js'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onUseMeta, onIsLoading, onResize } = useCommonActions()
const { onApiGetCommonServerTime } = useProjectActions()
const buyList = useBuyListStore()
const { region, mrt, pagination, content, keyword } = storeToRefs(buyList)
// H1 由共用 Header 讀 project.seo.h1 輸出。列表本身(含 seo)在 middleware/buyList
// 就取好了 —— 頁首的渲染早於這裡的 setup,放在這一頁取的話 SSR 的 H1 會是空的。
// 換頁清空由 middleware/seoReset 處理。
const {
  onApiGETRealEstatePurposeCheckOptions,
  onApiGETRealEstateTypeSelectOptions,
  onApiGETRealEstateFaceSelectOptions,
  onApiGETRealEstateParkingModeSelectOptions,
  onApiGETRealEstateNearByCheckOptions,
  onApiGETRealEstateFeatureCheckOptions,
} = useManageActions()
const {
  isChannelRegion,
  isChannelMrt,
  commonParams,
  commonQuery,
  onApiGetRegion,
  onApiGetMrt,
  onApiGetBuyListFocus,
  onApiGetBuyList,
  onApiGetBuySuggest,
} = useBuyListActions()
const { onApiErrorServerToClient } = usePopupActions()
const route = useRoute()
const router = useRouter()

definePageMeta({
  layout: 'buy',
  channel: 'buy',
  middleware: 'buy-list',
})

const isDeviceM = computed(() => device.value === 'm')
const paramsRegion = computed(() => {
  const { ids } = region.value

  return ids ? [`${ids}_region`] : []
})

const paramsMrt = computed(() => {
  const { ids } = mrt.value

  return ids ? [`${ids}_mrt`] : []
})
const paramsChannel = computed(() =>
  isChannelRegion.value ? paramsRegion.value : isChannelMrt.value ? paramsMrt.value : []
)
const data = computed(() => content.value.data || [])
const hasData = computed(() => data.value?.length !== 0 || false)

// 關鍵字建議:選項由 onApiGetBuySuggest 寫進 store 的 keyword.options,子層自己讀。
// 初次載入先抓一次當預設清單;輸入時 SearchKeyword 會把 AutoComplete 的
// setOptions 傳上來,打完再回填以解除讀取中狀態
const onBuySuggest = async (setOptions) => {
  await onApiGetBuySuggest()

  setOptions?.(keyword.value.options)

  return keyword.value.options
}

// 列表本身(含 seo)在 middleware/buyList 就取好了 —— 那裡跑在頁面元件建立之前,
// 共用頁首的 H1 才讀得到。這裡只補「與網址無關、進來抓一次就夠」的那幾支。
//
// callOnce 而不是 useAsyncData:這幾支的回傳值沒有人讀,資料是由 action 寫進 store 的。
// useAsyncData 會把自己那份(空的)結果再序列化進 payload 一次,而真正的資料走 store 的 payload。
//
// 這裡用 Promise.all 而不是 awaitAllPromise,是因為這是**進入頁面的第一次取資料**:
// 失敗要往上拋,伺服器端才會回 500。吞掉的話會送出一個內容是空的、狀態卻是 200 的頁面。
// 換頁之後的重取在下面的 onBeforeRouteUpdate,那裡用的是相反的做法,理由寫在那一段。
await Promise.all([
  // server time 只用於「天」級距相對時間,初次載入抓一次即可,換頁不需重打
  callOnce('common-server-time', () => onApiGetCommonServerTime()),
  // 縣市與捷運的選項:middleware/buyList 驗證網址代碼時會先取,
  // 但只在網址真的帶了那一種代碼時才取 —— 畫面上的兩個下拉一律要有選項,所以這裡補齊。
  // action 自己認得「載過就不再取」,兩邊都呼叫也只會打一次。
  callOnce('region-options', () => onApiGetRegion()),
  callOnce('mrt-options', () => onApiGetMrt()),
  callOnce('purpose-options', () => onApiGETRealEstatePurposeCheckOptions()),
  callOnce('type-options', () => onApiGETRealEstateTypeSelectOptions()),
  callOnce('face-options', () => onApiGETRealEstateFaceSelectOptions()),
  callOnce('parking-options', () => onApiGETRealEstateParkingModeSelectOptions()),
  callOnce('near-options', () => onApiGETRealEstateNearByCheckOptions()),
  callOnce('features-options', () => onApiGETRealEstateFeatureCheckOptions()),
  callOnce('buy-list-focus', () => onApiGetBuyListFocus()),
  callOnce('buy-suggest', () => onBuySuggest()),
])

onUseMeta({
  url: useRequestURL(),
})


// 原地搜尋(不改 URL):以目前路由重打 buy-list
const onBuyList = async () => {
  onIsLoading(true)
  await onApiGetBuyList(route)
  onIsLoading(false)
}

const onRoutePush = async () => {
  await router.push({
    name: buyList.basicRouteName,
    params: {
      filters: [...paramsChannel.value, ...commonParams.value],
    },
    query: {
      pg: 1,
      ...commonQuery.value,
    },
  })
}

// 換頁(改篩選、翻頁)之後的收尾。
//
// 列表本身與篩選參數不在這裡重打 —— 換頁守衛 middleware/buyList 每一次導航都會跑,
// 那邊已經依新網址取好了。這裡補的是與網址無關、守衛不管的推薦區塊,以及捲回頂端。
//
// 用 awaitAllPromise 而不是 Promise.all:這時畫面上已經有列表,
// 為了推薦區塊失敗把整頁換成錯誤頁,使用者反而失去原本看得到的內容。
// 初次載入在上面用的是 Promise.all(失敗要回 500),兩者刻意不同。
onBeforeRouteUpdate(async (to, from) => {
  if (to.fullPath === from.fullPath) return

  onIsLoading(true)
  await awaitAllPromise([onApiGetBuyListFocus()])
  onIsLoading(false)

  if (import.meta.client) {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }
})

onResize()

onMounted(() => {
  onApiErrorServerToClient()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div class="bg-[--white] pt:pt-[12px]">
    <PageBuyListTabOvalResponsive />
    <PageBuyListSearchFunction
      @apiSearch="onBuyList"
      @routerPush="onRoutePush"
      @suggest="onBuySuggest"
    />
  </div>
  <CommonMContainer class="p:--max-w-1220 p:--px-10 t:mt-[10px] p:mt-[20px]">
    <PageBuyListFocus />
    <CommonMContent class="--hasBgColor pt:--rounded-20 pt:--py-20 p:--px-30 m:--pb-20 tm:--px-16 t:mx-[10px]">
      <PageBuyListSearchFilter
        @click="onBuyList"
        @click:routePush="onRoutePush"
        v-if="!isDeviceM"
      />
      <PageBuyListSearchFeatures @routerPush="onRoutePush" />
      <!-- <pre>
        {{ options.caseType }}
      </pre> -->
      <template v-if="hasData">
        <PageBuyListContent />
        <CommonMPagination
          :route="{
            name: buyList.basicRouteName,
            params: route.params,
          }"
          :config="{
            nowPage: pagination.page,
            itemsPage: pagination.pageSize,
            pageNumber: 5,
            total: pagination.total,
            queryKey: 'pg',
          }"
          :setClass="{
            main: 'mt-[20px]',
          }"
        />
      </template>
      <PageBuyListNoData @routerPush="onRoutePush" v-if="!hasData" />
    </CommonMContent>
  </CommonMContainer>
  <BuyMTop />
  <PageBuyListPopupFeatures />
  <PageBuyCommonPopupMessage />
  <PageBuyCommonPopupVerifyCode />
  <PageBuyCommonPopupCottonCandy />
  <PageBuyCommonPopupMessageSuccess />
  <PageBuyCommonPopupCottonCandySuccess />
  <PageBuyCommonPopupMessageFailed />
</template>
