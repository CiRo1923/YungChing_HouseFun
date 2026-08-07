<script setup>
import { awaitAllPromise } from '@js/_prototype.js'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onUseMeta, onIsLoading, onWithLoadingAll, onResize } = useCommonActions()
const { onApiGetCommonServerTime } = useProjectActions()
const buyList = useBuyListStore()
const { region, mrt, pagination, content, keyword } = storeToRefs(buyList)

// H1 由共用 Header 讀 project.seo.h1 輸出:SSR 由 middleware/buySeo 預抓、
// client 由本頁 onApiBuyList → onSetSeo 更新、換頁清空由 middleware/seoReset 處理。
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
  onGetBuyListParams,
  onApiRegion,
  onApiMrt,
  onApiBuyListFocus,
  onApiBuyList,
  onApiBuySuggest,
  onChannel,
} = useBuyListActions()
const { onApiErrorServerToClient } = usePopupActions()
const route = useRoute()
const router = useRouter()

definePageMeta({
  layout: 'buy',
  channel: 'buy',
  requiresAuth: false,
})

const isDeviceM = computed(() => device.value === 'm')
// const channel = computed(() => {
//   if (isChannelRegion.value) return 'region'
//   if (isChannelMrt.value) return 'mrt'

//   return ''
// })
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
const hasData = computed(() => content.value?.length !== 0 || false)

// 關鍵字建議:選項由 onApiBuySuggest 寫進 store 的 keyword.options,子層自己讀。
// 初次載入先抓一次當預設清單;輸入時 SearchKeyword 會把 AutoComplete 的
// setOptions 傳上來,打完再回填以解除讀取中狀態
const onBuySuggest = async (setOptions) => {
  await onApiBuySuggest()

  setOptions?.(keyword.value.options)

  return keyword.value.options
}

onChannel()
onGetBuyListParams()

// buy-list / buy-list-focus 不掛 watch:初次載入抓一次,後續導航 / 搜尋一律由
// 路由守衛 (onRouteChanged) 與 onApiSearch 顯式呼叫,避免 watch 與手動呼叫重複
await onWithLoadingAll([
  // server time 只用於「天」級距相對時間,初次載入抓一次即可,換頁不需重打
  useAsyncData('common-server-time', () => onApiGetCommonServerTime()),
  useAsyncData('region-options', () => onApiRegion()),
  useAsyncData('mrt-options', () => onApiMrt()),
  useAsyncData('purpose-options', () => onApiGETRealEstatePurposeCheckOptions()),
  useAsyncData('type-options', () => onApiGETRealEstateTypeSelectOptions()),
  useAsyncData('face-options', () => onApiGETRealEstateFaceSelectOptions()),
  useAsyncData('parking-options', () => onApiGETRealEstateParkingModeSelectOptions()),
  useAsyncData('near-options', () => onApiGETRealEstateNearByCheckOptions()),
  useAsyncData('features-options', () => onApiGETRealEstateFeatureCheckOptions()),
  useAsyncData('buy-list-focus', () => onApiBuyListFocus()),
  useAsyncData('buy-list', () => onApiBuyList()),
  useAsyncData('buy-suggest', () => onBuySuggest()),
])

onUseMeta({
  url: useRequestURL(),
})

const onRouteChanged = async (to) => {
  // 先同步 store(channel / 篩選參數),再以新路由 to 重打
  onChannel(to)
  onGetBuyListParams(to)

  onIsLoading(true)
  await awaitAllPromise([onApiBuyList(to), onApiBuyListFocus()])
  onIsLoading(false)

  if (import.meta.client) {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }
}

// 原地搜尋(不改 URL):以目前路由重打 buy-list
const onApiSearch = async () => {
  onIsLoading(true)
  await onApiBuyList()
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

onBeforeRouteUpdate(async (to, from) => {
  if (to.fullPath === from.fullPath) return
  await onRouteChanged(to)
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
  <!-- <pre>{{ onParseFilters() }}</pre> -->
  <!-- <pre>
    {{ route }}
  </pre> -->
  <!-- <div>
    <pre
      >{{ options.city }}
    </pre>
  </div> -->

  <div class="bg-[--white] pt:pt-[12px]">
    <PageBuyListTabOvalResponsiv />
    <PageBuyListSearchFunction
      @apiSearch="onApiSearch"
      @routerPush="onRoutePush"
      @suggest="onBuySuggest"
    />
  </div>
  <CommonMContainer class="p:--max-w-1220 p:--px-10 t:mt-[10px] p:mt-[20px]">
    <PageBuyListFocus />
    <CommonMContent class="pt:--rounded-20 pt:--py-20 p:--px-30 m:--pb-20 tm:--px-16 t:mx-[10px]">
      <PageBuyListSearchFilter
        @click="onApiSearch"
        @click:routePush="onRoutePush"
        v-if="!isDeviceM"
      />
      <PageBuyListSearchFeatures @routerPush="onRoutePush" />
      <!-- <pre>
        {{ options.caseType }}
      </pre> -->
      <template v-if="hasData">
        <PageBuyListContent />
        <BuyMPagination
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

<style></style>
