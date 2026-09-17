<script setup>
// const common = useCommonStore()
const { onUseMeta } = useCommonActions()
const buyProject = useBuyProjectStore()
// const { renewal } = storeToRefs(buyProject)
const {
  onApiGetVasPublishAvailablePlans,
  onApiGetVasPublishGetPublishResponse,
  onApiGetVasGoldenGetPlanList,
} = useBuyProjectActions()
const buyPublish = useBuyPublishStore()
const { statusData } = storeToRefs(buyPublish)
const { onApiGetBuyRealEstateCaseStatusHfID } = useBuyPublishActions()
const { onApiErrorServerToClient } = usePopupActions()

const route = useRoute()

definePageMeta({
  layout: 'buy',
  // 登入機制還沒接上,目前沒有任何地方讀這個值 —— 接上之後由路由守衛依它決定要不要擋
  requiresAuth: true,
  title: '出售物件刊登',
  // hfID 一定是數字。validate 在元件載入前就攔下,不會帶著壞掉的 id 去打 API,
  // 回 false 走的是共用的 404 頁(見專案根目錄 error.vue)
  validate: (route) => /^\d+$/.test(route.params.id),
})

const hfID = computed(() => route.params.id)

// 先取得 物件狀態
await useAsyncData(`case-status-renewal-${hfID.value}`, () =>
  onApiGetBuyRealEstateCaseStatusHfID(hfID.value)
)

await Promise.all([
  useAsyncData(`case-status-finish-${hfID.value}`, () => onApiGetBuyRealEstateCaseStatusHfID(hfID.value)),
  useAsyncData(`available-plans-publish-finish-${hfID.value}`, () =>
    onApiGetVasPublishAvailablePlans(hfID.value)
  ),
  useAsyncData(`get-publish-response-finish-${hfID.value}`, () =>
    onApiGetVasPublishGetPublishResponse(hfID.value)
  ),
  callOnce('golden-planList-finish', () => onApiGetVasGoldenGetPlanList()),
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
  <PageBuyPopupAutoRefreshTemplate />
  <PageBuyPopupAutoRefreshTemplateCheck />
  <PageBuyPopupAutoRefreshTemplateRenewal />
  <PageBuyPopupAutoRefreshTemplateEditTime />
</template>
