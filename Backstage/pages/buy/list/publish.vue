<script setup>
definePageMeta({
  layout: 'buy',
  middleware: 'page-query',
  // 登入機制還沒接上,目前沒有任何地方讀這個值 —— 接上之後由路由守衛依它決定要不要擋
  requiresAuth: true,
  title: '物件管理',
  channel: 'publish',
})

const buyProject = useBuyProjectStore()
// 成交彈窗的日期上限要用,由這一頁取一次,彈窗裡的元件只讀 store
const { onApiGetCommonServerTime } = useBuyProjectActions()
const { onUseMeta, onIsLoading } = useCommonActions()
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

const onBuyRealEstateSearch = async (done) => {
  const result = await onApiPostBuyRealEstateSearch(1)

  if (typeof done === 'function') done()

  return result
}

const listPublish = useAsyncData('list-publish', () => onBuyRealEstateSearch(), {
  watch: [page],
})

// 進頁面取一次就結束的用 callOnce:回傳值沒有人讀,資料由 action 寫進 store。
// 列表本身留在 useAsyncData —— 它用的 watch 與 status 是 callOnce 沒有的:
// 換 pg 自動重取、重取時驅動遮罩(那時頁面元件不會重建,換頁生命週期不會觸發)。
await Promise.all([
  callOnce('common-server-time', () => onApiGetCommonServerTime()),
  callOnce('list-search-filter', () => onApiGetBuyRealEstateSearchFilter()),
  callOnce('list-plan-aggergate-publish', () => onApiGetVasCommonPlanAggregate()),
  callOnce('list-case-aggregate-publish', () => onApiGetBuyRealEstateCaseAggregate()),
  callOnce('available-plans-publish', () => onApiGetVasPublishAvailablePlans()),
  callOnce('golden-planList-publish', () => onApiGetVasGoldenGetPlanList()),
  callOnce('comments-search-publish', () => onApiGetBuyCommentsSearchCommentFilter()),
  // 首次載入也要等列表回來;之後的重取由上面的 watch 自己處理
  listPublish,
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
      <PageBuyListFilterPublish @search="onBuyRealEstateSearch" />
    </PageBuyListTabDefaultOval>
    <PageBuyListContent
      :funEventsItem="funEventsItem"
      :contentEventsItem="contentEventsItem"
      @update="onBuyRealEstateSearch"
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
  <PageBuyPopupAutoRefresh :update="onBuyRealEstateSearch" />
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
