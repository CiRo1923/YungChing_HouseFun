<script setup>
definePageMeta({
  layout: 'buy',
  requiresAuth: true,
  title: '物件管理',
})

const buyProject = useBuyProjectStore()
const { onUseMeta, onWithLoadingAll } = useCommonActions()
const { onApiGetPublishAvailablePlans, onApiGETGoldenGetPlanList } = useBuyProjectActions()
const {
  onApiGETCommonPlanAggregate,
  onApiGETRealEstateSearchFilter,
  onApiPOSTRealEstateCaseAggregate,
  onApiPOSTRealEstateSearch,
} = useBuyListActions()
const { onApiErrorServerToClient } = useBuyPopupActions()
const route = useRoute()
const page = computed(() => route.query.pg)
// publish (刊登) / deal (成交)
const funEventsItem = ['publish', 'deal']
// editor (修改) / deal (成交)
const contentEventsItem = ['editor', 'deal']

const onUpdate = async (done) => {
  const result = await onApiPOSTRealEstateSearch(4)

  if (typeof done === 'function') done()

  return result
}

await onWithLoadingAll([
  useAsyncData('list-search-filter', () => onApiGETRealEstateSearchFilter()),
  useAsyncData('list-plan-aggergate-offline', () => onApiGETCommonPlanAggregate()),
  useAsyncData('list-case-aggregate-offline', () => onApiPOSTRealEstateCaseAggregate()),
  useAsyncData('list-offline', () => onUpdate(), {
    watch: [page],
  }),
  useAsyncData('available-plans-offline', () => onApiGetPublishAvailablePlans()),
  useAsyncData('golden-planList-offline', () => onApiGETGoldenGetPlanList()),
])

onUseMeta({
  title: `物件管理 - 已下架 | ${buyProject.NAME}`,
  description: '',
  url: useRequestURL(),
})

onMounted(() => {
  onApiErrorServerToClient()
})
</script>

<template>
  <BuyMContainer
    :setClass="{
      main: '--px-16',
      headerTools: 'm:mt-[32px]',
    }"
  >
    <template #header_tools>
      <PageBuyListItemsInfo />
    </template>
    <PageBuyListTabDefaultOval>
      <PageBuyListFilterOffline @search="onUpdate" />
    </PageBuyListTabDefaultOval>
    <PageBuyListContent
      :funEventsItem="funEventsItem"
      :contentEventsItem="contentEventsItem"
      v-slot="{ item, publishFun }"
      @update="onUpdate"
    >
      <PageBuyListItemOfflineInfo :data="item" @click:publish="publishFun" class="m:mt-[24px]" />
    </PageBuyListContent>
  </BuyMContainer>
  <PageBuyListPopupRenewal />
  <PageBuyListPopupOffline />
  <PageBuyListPopupDeal />
  <PageBuyPopupGolden />
  <PageBuyListPopupView />
</template>

<style></style>
