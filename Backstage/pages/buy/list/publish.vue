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
// renewal (續刊) / offline (下架) / deal (成交)
const funEventsItem = ['renewal', 'offline', 'deal']
// editor (修改) / offline (下架) / deal (成交)
const contentEventsItem = ['editor', 'offline', 'deal']
const page = computed(() => route.query.pg)

const onUpdate = async (done) => {
  const result = await onApiPOSTRealEstateSearch(1)

  if (typeof done === 'function') done()

  return result
}

await onWithLoadingAll([
  useAsyncData('list-search-filter', () => onApiGETRealEstateSearchFilter()),
  useAsyncData('list-plan-aggergate-publish', () => onApiGETCommonPlanAggregate()),
  useAsyncData('list-case-aggregate-publish', () => onApiPOSTRealEstateCaseAggregate()),
  useAsyncData('list-publish', () => onUpdate(), {
    watch: [page],
  }),
  useAsyncData('available-plans-publish', () => onApiGetPublishAvailablePlans()),
  useAsyncData('golden-planList-publish', () => onApiGETGoldenGetPlanList()),
])

onUseMeta({
  title: `物件管理 - 刊登中 | ${buyProject.NAME}`,
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
      <PageBuyListFilterPublish @search="onUpdate" />
    </PageBuyListTabDefaultOval>
    <PageBuyListContent
      :funEventsItem="funEventsItem"
      :contentEventsItem="contentEventsItem"
      v-slot="{ item, renewalFun, goldenFun, autoRefreshFun }"
      @update="onUpdate"
    >
      <PageBuyListItemSetting
        :data="item"
        @click:renewal="renewalFun"
        @click:golden="goldenFun"
        @click:auto-refresh="autoRefreshFun"
        class="m:mt-[24px]"
      />
    </PageBuyListContent>
  </BuyMContainer>
  <PageBuyListPopupRenewal />
  <PageBuyListPopupOffline />
  <PageBuyListPopupDeal />
  <PageBuyPopupGolden />
  <PageBuyPopupAutoRefresh />
  <PageBuyPopupEditTime />
  <PageBuyListPopupView />
</template>

<style></style>
