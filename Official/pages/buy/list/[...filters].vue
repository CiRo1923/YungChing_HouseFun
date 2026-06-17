<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const { onUseMeta, onIsLoading, onWithLoadingAll } = useCommonActions()
const buyList = useBuyListStore()
const { pagination } = storeToRefs(buyList)
const {
  onApiGETRealEstatePurposeCheckOptions,
  onApiGETRealEstateTypeSelectOptions,
  onApiGETRealEstateFaceSelectOptions,
  onApiGETRealEstateParkingModeSelectOptions,
  onApiGETRealEstateNearByCheckOptions,
} = useBuyProjectActions()
const { onGetBuyListParams, onApiRegion, onApiMrt, onApiBuyList, onChannel } = useBuyListActions()
const { onApiErrorServerToClient } = useBuyPopupActions()
const route = useRoute()

definePageMeta({
  layout: 'common',
  requiresAuth: false,
})

const isDeviceM = computed(() => device.value === 'm')

onChannel()
onGetBuyListParams()

await onWithLoadingAll([
  useAsyncData('region-options', () => onApiRegion()),
  useAsyncData('mrt-options', () => onApiMrt()),
  useAsyncData('purpose-options', () => onApiGETRealEstatePurposeCheckOptions()),
  useAsyncData('type-options', () => onApiGETRealEstateTypeSelectOptions()),
  useAsyncData('face-options', () => onApiGETRealEstateFaceSelectOptions()),
  useAsyncData('parking-options', () => onApiGETRealEstateParkingModeSelectOptions()),
  useAsyncData('near-options', () => onApiGETRealEstateNearByCheckOptions()),
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

  await onSearch(to)

  if (import.meta.client) {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }
}

const onSearch = async (to) => {
  onIsLoading(true)
  await onApiBuyList(to)
  onIsLoading(false)
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
    <PageBuyListSearchFunction />
  </div>
  <CommonMContainer class="--inner p:mt-[20px]">
    <CommonMContent class="pt:--rounded-20 p:--py-20 p:--px-30">
      <PageBuyListSearchFilter @click="onSearch" v-if="!isDeviceM" />
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
          main: 'p:mt-[40px]',
        }"
      />
    </CommonMContent>
  </CommonMContainer>
</template>

<style></style>
