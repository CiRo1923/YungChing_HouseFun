<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const { onUseMeta, onIsLoading, onWithLoadingAll } = useCommonActions()
const buyList = useBuyListStore()
const { region, mrt, pagination } = storeToRefs(buyList)
const {
  onApiGetCommonServerTime,
  onApiGETRealEstatePurposeCheckOptions,
  onApiGETRealEstateTypeSelectOptions,
  onApiGETRealEstateFaceSelectOptions,
  onApiGETRealEstateParkingModeSelectOptions,
  onApiGETRealEstateNearByCheckOptions,
  onApiGETRealEstateFeatureCheckOptions,
} = useBuyProjectActions()
const {
  isChannelRegion,
  isChannelMrt,
  commonParams,
  commonQuery,
  onGetBuyListParams,
  onApiRegion,
  onApiMrt,
  onApiBuyList,
  onChannel,
} = useBuyListActions()
const { onApiErrorServerToClient } = useBuyPopupActions()
const route = useRoute()
const router = useRouter()

definePageMeta({
  layout: 'common',
  requiresAuth: false,
})

const isDeviceM = computed(() => device.value === 'm')
const channel = computed(() => {
  if (isChannelRegion.value) return 'region'
  if (isChannelMrt.value) return 'mrt'

  return ''
})
const page = computed(() => route.query.pg || '1')
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

onChannel()
onGetBuyListParams()

await onWithLoadingAll([
  useAsyncData('common-server-time', () => onApiGetCommonServerTime(), {
    watch: [channel, page],
  }),
  useAsyncData('region-options', () => onApiRegion()),
  useAsyncData('mrt-options', () => onApiMrt()),
  useAsyncData('purpose-options', () => onApiGETRealEstatePurposeCheckOptions()),
  useAsyncData('type-options', () => onApiGETRealEstateTypeSelectOptions()),
  useAsyncData('face-options', () => onApiGETRealEstateFaceSelectOptions()),
  useAsyncData('parking-options', () => onApiGETRealEstateParkingModeSelectOptions()),
  useAsyncData('near-options', () => onApiGETRealEstateNearByCheckOptions()),
  useAsyncData('features-options', () => onApiGETRealEstateFeatureCheckOptions()),
  useAsyncData('buy-list-region', () => onApiBuyList()),
])

onUseMeta({
  title: '買屋、購屋、買房子 | 好房網買屋',
  description:
    '好房網教你用聰明、買好房!好房網每天更新待售房屋、租屋、實價登錄資訊，還有好房網 News 及好房網 TV，製作包羅萬象的房地產消息，讓你買房的路上不孤單，好房網陪你買房！',
  url: useRequestURL(),
})

const onRouteChanged = async (to) => {
  onChannel(to)
  onGetBuyListParams(to)

  await onApiSearch(to)

  if (import.meta.client) {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }
}

const onApiSearch = async (to) => {
  onIsLoading(true)
  await onApiBuyList(to)
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

  <div class="bg-[--white] p:pt-[12px]">
    <PageBuyListTabOvalResponsiv />
    <PageBuyListSearchFunction @apiSearch="onApiSearch" @routerPush="onRoutePush" />
  </div>
  <CommonMContainer class="--inner p:mt-[20px]">
    <CommonMContent class="pt:--rounded-20 p:--py-20 p:--px-30 m:--pb-20">
      <PageBuyListSearchFilter @click="onApiSearch" v-if="!isDeviceM" />
      <PageBuyListSearchFeatures @routerPush="onRoutePush" />
      <!-- <pre>
        {{ options.caseType }}
      </pre> -->
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
    </CommonMContent>
  </CommonMContainer>
  <PageBuyListPopupFeatures />
  <PageBuyCommonPopupComment />
</template>

<style></style>
