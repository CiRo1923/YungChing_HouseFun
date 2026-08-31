<script setup>
definePageMeta({
  layout: 'buy',
  requiresAuth: true,
  title: '物件管理',
  channel: 'deal',
})

const buyProject = useBuyProjectStore()
const { onUseMeta, onWithLoadingAll, onIsLoading } = useCommonActions()
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
// remove (刪除)
const funEventsItem = ['remove']
// remove (刪除)
const contentEventsItem = ['remove']
// sort
const options = [
  // {
  //   label: '預設',
  //   value: 0,
  // },
  {
    label: '成交日',
    value: 0,
    sort: {
      asc: {
        label: '舊',
        value: 1,
      },
      desc: {
        label: '新',
        value: 2,
      },
    },
  },
]

const onUpdate = async (done) => {
  const result = await onApiPOSTRealEstateSearch(3)

  if (typeof done === 'function') done()

  return result
}

const listDone = useAsyncData('list-done', () => onUpdate(), {
  watch: [page],
})

await onWithLoadingAll([
  useAsyncData('list-search-filter', () => onApiGETRealEstateSearchFilter()),
  useAsyncData('list-plan-aggergate-deal', () => onApiGETCommonPlanAggregate()),
  useAsyncData('list-case-aggregate-deal', () => onApiPOSTRealEstateCaseAggregate()),
  listDone,
  useAsyncData('comments-search-offline', () => onApiGETCommentssearchCommentFilter()),
])

// 換頁 (pg) 時頁面元件不會重建,loading 改由這支 asyncData 的狀態驅動
watch(listDone.status, (value) => {
  onIsLoading(value === 'pending')
})

onUseMeta({
  title: `物件管理 - 已成交 | ${buyProject.NAME}`,
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
      <PageBuyListFilterDeal @search="onUpdate" />
    </PageBuyListTabDefaultOval>
    <PageBuyListContent
      :funEventsItem="funEventsItem"
      :contentEventsItem="contentEventsItem"
      @update="onUpdate"
    >
      <template #sort="{ sortFun }">
        <PageBuyListFunctionsSort :options="options" @update="sortFun" />
      </template>
      <template #tools="{ item, dealFun }">
        <PageBuyListItemDealInfo :data="item" @click:deal="dealFun" />
      </template>
    </PageBuyListContent>
  </BuyMContainer>
  <PageBuyListPopupDeal />
  <PageBuyListPopupView />
  <PageBuyListPopupComment />
  <PageBuyListPopupCommentsReply />
  <PageBuyListPopupRemove />
</template>
