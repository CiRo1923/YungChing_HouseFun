<script setup>
// const common = useCommonStore()
const { onUseMeta, onWithLoadingAll } = useCommonActions()
const buyProject = useBuyProjectStore()
// const { renewal } = storeToRefs(buyProject)
const {
  onApiGetPublishAvailablePlans,
  onApiGETPublishGetPublishResponse,
  onApiGETGoldenGetPlanList,
} = useBuyProjectActions()
const buyPublish = useBuyPublishStore()
const { statusData } = storeToRefs(buyPublish)
const { onApiGERealEstateCaseStatus } = useBuyPublishActions()
const { onApiErrorServerToClient } = useBuyPopupActions()

const route = useRoute()

definePageMeta({
  layout: 'buy',
  requiresAuth: true,
  title: '出售物件刊登',
})

const hfID = computed(() => route.params.id)

// 先取得 物件狀態
await useAsyncData(`case-status-renewal-${hfID.value}`, () =>
  onApiGERealEstateCaseStatus(hfID.value)
)

await onWithLoadingAll([
  useAsyncData(`case-status-finish-${hfID.value}`, () => onApiGERealEstateCaseStatus(hfID.value)),
  useAsyncData(`available-plans-publish-finish-${hfID.value}`, () =>
    onApiGetPublishAvailablePlans(hfID.value)
  ),
  useAsyncData(`get-publish-response-finish-${hfID.value}`, () =>
    onApiGETPublishGetPublishResponse(hfID.value)
  ),
  useAsyncData('golden-planList-finish', () => onApiGETGoldenGetPlanList()),
])

onUseMeta({
  title: `物件管理 - 刊登完成 | ${buyProject.NAME}`,
  description: '',
  url: useRequestURL(),
})

onMounted(() => {
  onApiErrorServerToClient()
})
</script>

<template>
  <!-- <pre>
    {{ statusData }}
  </pre> -->
  <BuyMContainer
    :setClass="{
      main: '--px-16',
    }"
  >
    <template #tools>
      <PageBuyPublishBackStepNew
        :anchor="{
          to: {
            name: statusData.isExpired ? 'buy-publish-renewal-id' : 'buy-publish-basic-id',
            params: route.params,
          },
        }"
        :active="2"
      />
    </template>
    <div class="tm:mt-[24px] tm:space-y-[24px] p:mt-[32px] p:space-y-[32px]">
      <PageBuyPublishFinishContent />
      <PageBuyPublishFinishSubmitButtons />
    </div>
  </BuyMContainer>
  <PageBuyPopupGolden />
  <PageBuyPopupAutoRefresh />
  <PageBuyPopupAutoRefreshRenewal />
  <PageBuyPopupAutoRefreshAddTime />
  <PageBuyPopupAutoRefreshEditTime />
  <PageBuyPopupAutoRefreshSuccess />
</template>

<style></style>
