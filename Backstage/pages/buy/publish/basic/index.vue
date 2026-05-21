<script setup>
// import { awaitAllPromise } from '@js/_prototype.js'

import { Form } from 'vee-validate'

definePageMeta({
  layout: 'buy',
  requiresAuth: true,
  title: '出售物件刊登',
})

// const common = useCommonStore()
const { onUseMeta, onWithLoadingAll } = useCommonActions()
const buyProject = useBuyProjectStore()
// const { options } = storeToRefs(buyProject)
// const buyPublish = useBuyPublishStore()
// const { apiData } = storeToRefs(buyPublish)
const { onAllPromise, onApiPOSTRealEstate, onApiPOSTRealEstateNewCase, onApiPOSTRealEstateDraft } =
  useBuyPublishActions()
const { onAlert } = useBuyPopupActions()
const route = useRoute()
const router = useRouter()
const hfID = computed(() => route.params.id || '0')
// const newCaseAsync = useAsyncData('newCase', () => onApiPOSTRealEstateNewCase())

const onDraftSubmit = async () => {
  await onApiPOSTRealEstateDraft(hfID.value)
}

const onSaveSubmit = async (validate) => {
  const { valid } = await validate()

  if (valid) {
    const { status } = await onApiPOSTRealEstate(hfID.value)

    if (status === 200) {
      const isAlert = await onAlert({
        content: '儲存成功',
      })

      if (isAlert) {
        router.push({
          name: 'buy-publish-renewal-id',
          params: {
            id: hfID.value,
          },
        })
      }
    }
  }
}

await onWithLoadingAll([
  ...onAllPromise(),
  // newCaseAsync
])

onUseMeta({
  title: `物件管理 - 資料編輯 | ${buyProject.NAME}`,
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
      <PageBuyPublishBackStepNew
        :anchor="{
          to: {
            name: 'buy-list-publish',
            query: {
              pg: 1,
            },
          },
        }"
        :active="0"
      />
    </template>
    <PageBuyPublishBasicTabCheck />
    <Form
      as="div"
      class="tm:mt-[24px] tm:space-y-[24px] p:mt-[32px] p:space-y-[32px]"
      v-slot="{ validate }"
    >
      <!-- <pre>{{ apiData }}</pre> -->
      <PageBuyPublishBasicDataComponents />
      <PageBuyPublishBasicSubmitButtons
        @click:draft="onDraftSubmit"
        @click:save="() => onSaveSubmit(validate)"
      />
    </Form>
  </BuyMContainer>
  <PageBuyPublishBasicPopupAddressGoogleMap />
  <PageBuyPublishBasicPopupFeature />
  <PageBuyPublishBasicPopupTitleDeed />
</template>

<style lang="postcss"></style>
