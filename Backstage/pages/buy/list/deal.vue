<script setup>
definePageMeta({
  layout: 'buy',
  requiresAuth: true,
  title: '物件管理',
})

const buyProject = useBuyProjectStore()
const { onUseMeta, onWithLoadingAll } = useCommonActions()
const { onApiGETCommonPlanAggregate, onApiPOSTRealEstateCaseAggregate, onApiPOSTRealEstateSearch } =
  useBuyListActions()
const { onApiErrorServerToClient } = useBuyPopupActions()
const route = useRoute()
const page = computed(() => route.query.pg)
// remove (刪除)
const funEventsItem = ['remove']
// remove (刪除)
const contentEventsItem = ['remove']

const onUpdate = async (done) => {
  const result = await onApiPOSTRealEstateSearch(3)

  if (typeof done === 'function') done()

  return result
}

await onWithLoadingAll([
  useAsyncData('list-plan-aggergate-deal', () => onApiGETCommonPlanAggregate()),
  useAsyncData('list-case-aggregate-deal', () => onApiPOSTRealEstateCaseAggregate()),
  useAsyncData('list-done', () => onUpdate(), {
    watch: [page],
  }),
])

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
    <PageBuyListTabDefaultOval />
    <PageBuyListContent
      :funEventsItem="funEventsItem"
      :contentEventsItem="contentEventsItem"
      @update="onUpdate"
      v-slot="{ item, dealFun }"
    >
      <PageBuyListItemDealInfo :data="item" @click:deal="dealFun" />
    </PageBuyListContent>
  </BuyMContainer>
  <PageBuyListPopupDeal />
  <PageBuyListPopupView />
  <PageBuyListPopupRemove />
</template>

<style></style>
