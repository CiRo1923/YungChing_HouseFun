<script setup>
definePageMeta({
  layout: 'buy',
  requiresAuth: true,
  title: '物件管理',
  channel: 'publish',
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
// renewal (續刊) / offline (下架) / deal (成交)
const funEventsItem = ['renewal', 'offline', 'deal']
// editor (修改) / offline (下架) / deal (成交)
const contentEventsItem = ['editor', 'offline', 'deal']
// sort
const options = [
  {
    label: '預設',
    value: 0,
  },
  {
    label: '到期日',
    value: 2,
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
  {
    label: '總價',
    value: 6,
    sort: {
      asc: {
        label: '高',
        value: 1,
      },
      desc: {
        label: '低',
        value: 2,
      },
    },
  },
  {
    label: '留言數',
    value: 3,
    sort: {
      asc: {
        label: '少',
        value: 1,
      },
      desc: {
        label: '多',
        value: 2,
      },
    },
  },
  {
    label: '瀏覽數',
    value: 4,
    sort: {
      asc: {
        label: '少',
        value: 1,
      },
      desc: {
        label: '多',
        value: 2,
      },
    },
  },
]
const page = computed(() => route.query.pg)

const onUpdate = async (done) => {
  const result = await onApiPOSTRealEstateSearch(1)

  if (typeof done === 'function') done()

  return result
}

const listPublish = useAsyncData('list-publish', () => onUpdate(), {
  watch: [page],
})

await onWithLoadingAll([
  useAsyncData('list-search-filter', () => onApiGETRealEstateSearchFilter()),
  useAsyncData('list-plan-aggergate-publish', () => onApiGETCommonPlanAggregate()),
  useAsyncData('list-case-aggregate-publish', () => onApiPOSTRealEstateCaseAggregate()),
  listPublish,
  useAsyncData('available-plans-publish', () => onApiGetPublishAvailablePlans()),
  useAsyncData('golden-planList-publish', () => onApiGETGoldenGetPlanList()),
  useAsyncData('comments-search-publish', () => onApiGETCommentssearchCommentFilter()),
])

// 換頁 (pg) 時頁面元件不會重建,loading 改由這支 asyncData 的狀態驅動
watch(listPublish.status, (value) => {
  onIsLoading(value === 'pending')
})

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
      @update="onUpdate"
    >
      <template #sort="{ sortFun }">
        <PageBuyListFunctionsSort :options="options" @update="sortFun" />
      </template>
      <template #tools="{ item, renewalFun, goldenFun, autoRefreshFun }">
        <PageBuyListItemSetting
          :data="item"
          @click:renewal="renewalFun"
          @click:golden="goldenFun"
          @click:autoRefresh="autoRefreshFun"
          class="tm:mt-[24px]"
        />
      </template>
    </PageBuyListContent>
  </BuyMContainer>
  <PageBuyListPopupRenewal />
  <PageBuyListPopupOffline />
  <PageBuyListPopupDeal />
  <PageBuyPopupGolden />
  <PageBuyPopupAutoRefresh :update="onUpdate" />
  <PageBuyPopupAutoRefreshRenewal />
  <PageBuyPopupAutoRefreshAddTime />
  <PageBuyPopupAutoRefreshEditTime />
  <PageBuyPopupAutoRefreshSuccess />
  <PageBuyPopupAutoRefreshTemplate />
  <PageBuyPopupAutoRefreshTemplateCheck />
  <PageBuyPopupAutoRefreshTemplateRenewal />
  <PageBuyPopupAutoRefreshTemplateEditTime />
  <PageBuyListPopupView />
  <PageBuyListPopupComment />
  <PageBuyListPopupCommentsReply />
</template>

<style></style>
