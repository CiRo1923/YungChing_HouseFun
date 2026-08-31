<script setup>
definePageMeta({
  layout: 'buy',
  requiresAuth: true,
  title: '物件管理',
  channel: 'draft',
})

const buyProject = useBuyProjectStore()
const { onUseMeta, onWithLoadingAll, onIsLoading } = useCommonActions()
const { onApiGetPublishAvailablePlans, onApiGETGoldenGetPlanList } = useBuyProjectActions()
const {
  onApiGETCommonPlanAggregate,
  onApiGETRealEstateSearchFilter,
  onApiPOSTRealEstateCaseAggregate,
  onApiPOSTRealEstateSearch,
  onApiGETCommentssearchCommentFilter,
} = useBuyListActions()
const { onApiErrorServerToClient } = usePopupActions()
const route = useRoute()
const page = computed(() => route.query.pg)
// publish (刊登) / deal (成交) / remove (刪除)
const funEventsItem = ['publish', 'deal', 'remove']
// editor (修改) / deal (成交) / remove (刪除)
const contentEventsItem = ['editor', 'deal', 'remove']

const onUpdate = async (done) => {
  const result = await onApiPOSTRealEstateSearch(2)

  if (typeof done === 'function') done()

  return result
}

const listDraft = useAsyncData('list-draft', () => onUpdate(), {
  watch: [page],
})

await onWithLoadingAll([
  useAsyncData('list-search-filter', () => onApiGETRealEstateSearchFilter()),
  useAsyncData('list-plan-aggergate-draft', () => onApiGETCommonPlanAggregate()),
  useAsyncData('list-case-aggregate-draft', () => onApiPOSTRealEstateCaseAggregate()),
  listDraft,
  useAsyncData('available-plans-draft', () => onApiGetPublishAvailablePlans()),
  useAsyncData('golden-planList-draft', () => onApiGETGoldenGetPlanList()),
  useAsyncData('comments-search-draft', () => onApiGETCommentssearchCommentFilter()),
])

// 換頁 (pg) 時頁面元件不會重建,loading 改由這支 asyncData 的狀態驅動
watch(listDraft.status, (value) => {
  onIsLoading(value === 'pending')
})

onUseMeta({
  title: `物件管理 - 草稿區 | ${buyProject.NAME}`,
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
      <PageBuyListFilterDraft @search="onUpdate" />
    </PageBuyListTabDefaultOval>
    <PageBuyListContent
      :funEventsItem="funEventsItem"
      :contentEventsItem="contentEventsItem"
      @update="onUpdate"
    >
      <!-- <template #sort="{ sortFun }">
        <PageBuyListFunctionsSort @update="sortFun" />
      </template> -->
      <template #tools="{ item, publishFun }">
        <PageBuyListItemDraftInfo :data="item" @click:publish="publishFun" class="m:mt-[24px]" />
      </template>
    </PageBuyListContent>
  </BuyMContainer>
  <PageBuyListPopupRenewal />
  <PageBuyListPopupOffline />
  <PageBuyListPopupDeal />
  <PageBuyPopupGolden />
  <PageBuyListPopupView />
  <PageBuyListPopupComment />
  <PageBuyListPopupCommentsReply />
  <PageBuyListPopupRemove />
</template>
