<script setup>
definePageMeta({
  layout: 'buy',
  requiresAuth: true,
  title: '物件管理',
})

const buyProject = useBuyProjectStore()
const { onUseMeta, onWithLoadingAll } = useCommonActions()
const { onApiPOSTRealEstateCaseAggregate, onApiPOSTRealEstateSearch } = useBuyListActions()
const { onApiErrorServerToClient } = useBuyPopupActions()
const route = useRoute()
const page = computed(() => route.query.pg)
// remove (刪除)
const funEventsItem = ['remove']

const onUpdate = async (done) => {
  await onApiPOSTRealEstateSearch(3)

  done()
}

await onWithLoadingAll([
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
      @update="onUpdate"
      v-slot="{ item, dealFun }"
    >
      <PageBuyListItemDealInfo :data="item" @click:deal="dealFun" />
    </PageBuyListContent>
  </BuyMContainer>
  <PageBuyListPopupDeal />
</template>

<style></style>
