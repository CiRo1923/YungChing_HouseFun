<script setup>
definePageMeta({
  layout: 'common',
  requiresAuth: false,
})

const { onUseMeta, onWithLoadingAll } = useCommonActions()
const buyHouse = useBuyHouseStore()
const { detail } = storeToRefs(buyHouse)
// const popup = useBuyPopupStore()
const { onApiBuyHouse } = useBuyHouseActions()
const { onApiGETRealEstateTypeSelectOptions } = useBuyProjectActions()

const route = useRoute()
const seo = computed(() => detail.value?.seo ?? {})

await onWithLoadingAll([
  useAsyncData('type-options', () => onApiGETRealEstateTypeSelectOptions()),
  useAsyncData(`buy-detail-${route.params.hfid}`, () => onApiBuyHouse()),
])

onUseMeta({
  title: seo.value.title,
  description: seo.value.description,
  url: useRequestURL(),
})
</script>

<template>
  <div class="bg-[--white] py-[12px] tm:px-[15px]">
    <CommonMContainer class="--inner">
      <PageBuyHouseBreadcrumbs />
    </CommonMContainer>
  </div>
  <!-- <pre>
    {{ detail }}
  </pre> -->
  <!-- <pre>
    {{ seo }}
  </pre> -->
  <CommonMContainer class="--inner tm:space-y-[8px] p:mt-[45px] p:space-y-[12px]">
    <PageBuyHouseBasic />
    <PageBuyHouseFocus />
    <PageBuyHouseInformation />
    <PageBuyHouseFeatures />
    <PageBuyHouseEnvironment />
    <PageBuyHouseCommunity />
    <PageBuyHouseActualPrice />
    <PageBuyHouseSocialLife />
    <PageBuyHouseAgentPick />
    <PageBuyHouseHotForYou />
    <PageBuyHouseConstruction />
  </CommonMContainer>
  <!-- <PageBuyHousePopupAskMessage /> -->
</template>

<style></style>
