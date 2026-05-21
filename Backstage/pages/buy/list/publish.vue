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
// renewal (續刊) / offline (下架) / deal (成交)
const funEventsItem = ['renewal', 'offline', 'deal']
// editor (修改) / offline (下架) / deal (成交)
const contentEventsItem = ['editor', 'offline', 'deal']
const page = computed(() => route.query.pg)

const onUpdate = async (done) => {
  await onApiPOSTRealEstateSearch(1)
  done()
}

await onWithLoadingAll([
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
      v-slot="{ item, renewalFun, goldenFun }"
      @update="onUpdate"
    >
      <PageBuyListItemSetting
        :data="item"
        @click:renewal="renewalFun"
        @click:golden="goldenFun"
        class="m:mt-[24px]"
      />
    </PageBuyListContent>
  </BuyMContainer>
  <PageBuyListPopupRenewal />
  <PageBuyListPopupOffline />
  <PageBuyListPopupDeal />
  <PageBuyPopupGolden />
</template>

<style></style>
