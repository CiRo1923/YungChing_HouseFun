<script setup>
definePageMeta({
  layout: 'buy',
  requiresAuth: true,
  title: '物件管理',
  channel: 'offline',
})

const buyProject = useBuyProjectStore()
const { onUseMeta, onWithLoadingAll, onIsLoading } = useCommonActions()
const { onApiGetVasPublishAvailablePlans, onApiGetVasGoldenGetPlanList } = useBuyProjectActions()
const {
  onApiGetVasCommonPlanAggregate,
  onApiGetBuyRealEstateSearchFilter,
  onApiGetBuyRealEstateCaseAggregate,
  onApiPostBuyRealEstateSearch,
  onApiGetBuyCommentsSearchCommentFilter,
} = useBuyListActions()
const { onApiErrorServerToClient } = usePopupActions()
const route = useRoute()
const page = computed(() => route.query.pg)
// publish (刊登) / deal (成交)
const funEventsItem = ['publish', 'deal']
// editor (修改) / deal (成交)
const contentEventsItem = ['editor', 'deal']

// sort
const options = [
  // {
  //   label: '預設',
  //   value: 0,
  // },
  {
    label: '下架日',
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
  const result = await onApiPostBuyRealEstateSearch(4)

  if (typeof done === 'function') done()

  return result
}

const listOffline = useAsyncData('list-offline', () => onUpdate(), {
  watch: [page],
})

await onWithLoadingAll([
  useAsyncData('list-search-filter', () => onApiGetBuyRealEstateSearchFilter()),
  useAsyncData('list-plan-aggergate-offline', () => onApiGetVasCommonPlanAggregate()),
  useAsyncData('list-case-aggregate-offline', () => onApiGetBuyRealEstateCaseAggregate()),
  listOffline,
  useAsyncData('available-plans-offline', () => onApiGetVasPublishAvailablePlans()),
  useAsyncData('golden-planList-offline', () => onApiGetVasGoldenGetPlanList()),
  useAsyncData('comments-search-offline', () => onApiGetBuyCommentsSearchCommentFilter()),
])

// 換頁 (pg) 時頁面元件不會重建,loading 改由這支 asyncData 的狀態驅動
watch(listOffline.status, (value) => {
  onIsLoading(value === 'pending')
})

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
      @update="onUpdate"
    >
      <template #sort="{ sortFun }">
        <PageBuyListFunctionsSort :options="options" @update="sortFun" />
      </template>
      <template #tools="{ item, publishFun }">
        <PageBuyListItemOfflineInfo :data="item" @click:publish="publishFun" class="m:mt-[24px]" />
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
</template>
