<script setup>
definePageMeta({
  layout: 'buy',
  requiresAuth: true,
  title: '物件管理',
})

const buyProject = useBuyProjectStore()
const { onUseMeta, onWithLoadingAll } = useCommonActions()
const { onApiGetPublishAvailablePlans, onApiGETGoldenGetPlanList } = useBuyProjectActions()
const { onApiPOSTRealEstateCaseAggregate, onApiPOSTRealEstateSearch } = useBuyListActions()
const route = useRoute()
const page = computed(() => route.query.pg)
// publish (刊登) / deal (成交)
const funEventsItem = ['publish', 'deal']
// editor (修改) / deal (成交)
const contentEventsItem = ['editor', 'deal']

const onUpdate = async (done) => {
  await onApiPOSTRealEstateSearch(2)

  done()
}

await onWithLoadingAll([
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
</template>

<style></style>
