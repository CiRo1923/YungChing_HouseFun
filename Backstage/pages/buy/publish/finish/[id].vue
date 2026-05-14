<script setup>
import BackStepNew from '@pages/buy/publish/_components/BackStepNew.vue'

import Content from '@pages/buy/publish/finish/_components/Content.vue'
import SubmitButtons from '@pages/buy/publish/finish/_containers/SubmitButtons.vue'

// import { useCommonStore } from '@stores/common.js'
import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyPublishStore } from '@stores/buy/publish.js'
import useCommonActions from '@stores/.composables/useCommonActions.js'
import useBuyProjectActions from '@stores/buy/.composables/useProjectActions.js'
import useBuyPublishActions from '@stores/buy/.composables/usePublishActions.js'

// const common = useCommonStore()
const { onUseMeta, onWithLoadingAll } = useCommonActions()
const buyProject = useBuyProjectStore()
// const { renewal } = storeToRefs(buyProject)
const { onApiGetPublishAvailablePlans, onApiGETPublishGetPublishResponse } = useBuyProjectActions()
const buyPublish = useBuyPublishStore()
const { statusData } = storeToRefs(buyPublish)
const { onApiGERealEstateCaseStatus } = useBuyPublishActions()

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
])

onUseMeta({
  title: `物件管理 - 刊登完成 | ${buyProject.NAME}`,
  description: '',
  url: useRequestURL(),
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
      <BackStepNew
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
      <Content />
      <SubmitButtons />
    </div>
  </BuyMContainer>
</template>

<style></style>
