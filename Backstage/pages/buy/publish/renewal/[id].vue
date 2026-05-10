<script setup>
import BackStepNew from '@pages/buy/publish/_components/BackStepNew.vue'

import Content from '@pages/buy/publish/renewal/_components/Content.vue'
import SubmitButtons from '@pages/buy/publish/renewal/_containers/SubmitButtons.vue'

// import { useCommonStore } from '@stores/common.js'
import { useBuyProjectStore } from '@stores/buy/project.js'
import useCommonActions from '@stores/composables/useCommonActions.js'
import useBuyProjectActions from '@stores/buy/composables/useProjectActions.js'
import useBuyRenewalActions from '@stores/buy/composables/useRenewalActions.js'
// import useBuyListActions from '@stores/buy/composables/useListActions.js'
import useBuyPopupActions from '@stores/buy/composables/usePopupActions.js'

import { Form } from 'vee-validate'

// const common = useCommonStore()
const { onUseMeta, onWithLoadingAll } = useCommonActions()
const buyProject = useBuyProjectStore()
// const { renewalPlanId } = storeToRefs(buyProject)
const { onApiGetPublishAvailablePlans, onApiPOSTPublishSubmit } = useBuyProjectActions()
const { onApiPOSTRealEstateReadToPublish } = useBuyRenewalActions()
const { onAlert, onApiPromise } = useBuyPopupActions()
const route = useRoute()
const router = useRouter()

definePageMeta({
  layout: 'buy',
  requiresAuth: true,
  title: '出售物件刊登',
})

const hfID = computed(() => route.params.id)

const onDraftSubmit = async (validate) => {
  const { valid } = await validate()

  if (valid) {
    onApiPromise('open')

    const { status } = await onApiPOSTRealEstateReadToPublish(hfID.value)

    onApiPromise('close')

    if (status === 200) {
      onAlert({
        content: '儲存成功',
      })
    }
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

await onWithLoadingAll([
  useAsyncData(`available-plans-publish-renewal-${hfID.value}`, () =>
    onApiGetPublishAvailablePlans(hfID.value)
  ),
])

onUseMeta({
  title: `物件管理 - 選擇額度 | ${buyProject.NAME}`,
  description: '',
  url: useRequestURL(),
})
</script>

<template>
  <BuyMContainer
    :setClass="{
      main: '--px-16',
    }"
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
      <SubmitButtons
        @click:draft="onDraftSubmit(validate)"
        @click:save="() => onSaveSubmit(validate)"
      />
    </Form>
  </BuyMContainer>
</template>

<style></style>
