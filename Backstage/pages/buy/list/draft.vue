<script setup>
definePageMeta({
  layout: 'buy',
  requiresAuth: true,
  title: '物件管理',
})

const buyProject = useBuyProjectStore()
const { onUseMeta, onWithLoadingAll } = useCommonActions()
const { onApiGetPublishAvailablePlans, onApiGETGoldenGetPlanList } = useBuyProjectActions()
const { onApiGETCommonPlanAggregate, onApiPOSTRealEstateCaseAggregate, onApiPOSTRealEstateSearch } =
  useBuyListActions()
const { onApiErrorServerToClient } = useBuyPopupActions()
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

await onWithLoadingAll([
  useAsyncData('list-plan-aggergate-draft', () => onApiGETCommonPlanAggregate()),
  useAsyncData('list-case-aggregate-draft', () => onApiPOSTRealEstateCaseAggregate()),
  useAsyncData('list-draft', () => onUpdate(), {
    watch: [page],
  }),
  useAsyncData('available-plans-draft', () => onApiGetPublishAvailablePlans()),
  useAsyncData('golden-planList-draft', () => onApiGETGoldenGetPlanList()),
])

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
    <PageBuyListTabDefaultOval />
    <PageBuyListContent
      :funEventsItem="funEventsItem"
      :contentEventsItem="contentEventsItem"
      v-slot="{ item, publishFun }"
      @update="onUpdate"
    >
      <PageBuyListItemDraftInfo :data="item" @click:publish="publishFun" class="m:mt-[24px]" />
    </PageBuyListContent>
  </BuyMContainer>
  <PageBuyListPopupRenewal />
  <PageBuyListPopupOffline />
  <PageBuyListPopupDeal />
  <PageBuyPopupGolden />
  <PageBuyListPopupView />
</template>

<style></style>
