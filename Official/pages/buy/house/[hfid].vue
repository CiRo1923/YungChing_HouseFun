<script setup>
definePageMeta({
  layout: 'buy',
  channel: 'buy',
  requiresAuth: false,
})

const { onUseMeta, onWithLoadingAll } = useCommonActions()
const { onApiBuyHouse, onApiBuyHousePoi } = useBuyHouseActions()
const { onApiGETRealEstateTypeSelectOptions } = useBuyProjectActions()

// H1 由共用 Header 讀 project.seo.h1 輸出:
// SSR 由 middleware/buySeo 預抓、client 由本頁 onApiBuyHouse → onSetSeo 更新、
// 換頁清空由 middleware/seoReset 處理(勿用 onUnmounted,會晚於新頁設值而誤清)。

const route = useRoute()
const hfid = computed(() => route.params.hfid)

await onWithLoadingAll([
  useAsyncData('type-options', () => onApiGETRealEstateTypeSelectOptions()),
  useAsyncData(`buy-detail-${hfid.value}`, () => onApiBuyHouse()),
  useAsyncData(`buy-detail-poi-${hfid.value}`, () => onApiBuyHousePoi()),
])

onUseMeta({
  url: useRequestURL(),
})
</script>

<template>
  <div class="bg-[--white] py-[12px] tm:px-[15px]">
    <CommonMContainer class="p:--max-w-1220 p:--px-10">
      <PageBuyHouseBreadcrumbs />
    </CommonMContainer>
  </div>
  <CommonMContainer class="p:--max-w-1220 p:--px-10 tm:space-y-[8px] p:mt-[45px] p:space-y-[12px]">
    <PageBuyHouseBasic />
    <PageBuyHouseFocus />
    <PageBuyHouseInformation />
    <PageBuyHouseFeatures />
    <PageBuyHouseEnvironment />
    <PageBuyHouseCommunity />
    <PageBuyHouseActualPrice />
    <PageBuyHousePoi />
    <PageBuyHouseAgentPick />
    <PageBuyHouseHotForYou />
    <!-- <PageBuyHouseConstruction /> -->
  </CommonMContainer>
  <!-- <PageBuyHousePopupAskMessage /> -->
  <PageBuyCommonPopupMessage />
  <PageBuyCommonPopupVerifyCode />
  <PageBuyCommonPopupCottonCandy />
  <PageBuyCommonPopupMessageSuccess />
  <PageBuyCommonPopupCottonCandySuccess />
  <PageBuyCommonPopupMessageFailed />
</template>

<style></style>
