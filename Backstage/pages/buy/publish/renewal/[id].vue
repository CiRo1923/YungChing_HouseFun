<script setup>
import BackStepNew from '@pages/buy/publish/_components/BackStepNew.vue'

import Content from '@pages/buy/publish/renewal/_components/Content.vue'
import SubmitButtons from '@pages/buy/publish/renewal/_containers/SubmitButtons.vue'

// import { useCommonStore } from '@stores/common.js'
import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyPublishStore } from '@stores/buy/publish.js'
import useCommonActions from '@stores/composables/useCommonActions.js'
import useBuyProjectActions from '@stores/buy/composables/useProjectActions.js'
import useBuyPublishActions from '@stores/buy/composables/usePublishActions.js'
// import useBuyListActions from '@stores/buy/composables/useListActions.js'
import useBuyPopupActions from '@stores/buy/composables/usePopupActions.js'

import { Form } from 'vee-validate'

// const common = useCommonStore()
const { onUseMeta, onWithLoadingAll } = useCommonActions()
const buyProject = useBuyProjectStore()
// const { renewal } = storeToRefs(buyProject)
const buyPublish = useBuyPublishStore()
const { statusData } = storeToRefs(buyPublish)
const { onApiGetPublishAvailablePlans, onApiPOSTPublishSubmit } = useBuyProjectActions()
const { onApiGERealEstateCaseStatus, onApiPOSTRealEstateReadToPublish } = useBuyPublishActions()
const { onAlert, onApiPromise } = useBuyPopupActions()
const route = useRoute()
const router = useRouter()
const nuxtApp = useNuxtApp()
const requestURL = useRequestURL()

definePageMeta({
  layout: 'buy',
  requiresAuth: true,
  title: '出售物件刊登',
})

const hfID = computed(() => route.params.id)

const onDraftSubmit = async () => {
  onApiPromise('open')

  const { status } = await onApiPOSTRealEstateReadToPublish(hfID.value)

  onApiPromise('close')

  if (status === 200) {
    onAlert({
      content: '儲存成功',
    })
  }
}

const onSaveSubmit = async (validate) => {
  const { valid } = await validate()

  if (valid) {
    onApiPromise('open')

    const { status } = await onApiPOSTPublishSubmit([hfID.value])

    onApiPromise('close')

    if (status === 200) {
      const isAlert = await onAlert({
        content: '物件刊登完成',
      })

      if (isAlert) {
        router.push({
          name: 'buy-publish-finish-id',
          params: route.params,
        })
      }
    }
  }
}

// 先取得 物件狀態
await useAsyncData(`case-status-renewal-${hfID.value}`, () =>
  onApiGERealEstateCaseStatus(hfID.value)
)

// 如果 額度沒有過期 isExpired (true 過期 / false 未過期) 無法進入頁面
if (!statusData.value.isExpired) {
  await nuxtApp.runWithContext(() =>
    navigateTo(
      {
        name: 'buy-publish-basic-id',
        params: route.params,
      },
      {
        replace: true,
      }
    )
  )
} else {
  await onWithLoadingAll([onApiGetPublishAvailablePlans(hfID.value)])
}

onUseMeta({
  title: `物件管理 - 選擇額度 | ${buyProject.NAME}`,
  description: '',
  url: requestURL,
})
</script>

<template>
  <BuyMContainer
    :setClass="{
      main: '--px-16',
    }"
    v-if="statusData.isExpired"
  >
    <template #tools>
      <BackStepNew
        :anchor="{
          to: {
            name: 'buy-publish-basic-id',
            params: route.params,
          },
        }"
        :active="1"
      />
    </template>
    <Form
      as="div"
      class="tm:mt-[24px] tm:space-y-[24px] p:mt-[32px] p:space-y-[32px]"
      v-slot="{ validate }"
    >
      <Content />
      <SubmitButtons @click:draft="onDraftSubmit()" @click:save="() => onSaveSubmit(validate)" />
    </Form>
  </BuyMContainer>
</template>

<style></style>
