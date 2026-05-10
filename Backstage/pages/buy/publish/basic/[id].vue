<script setup>
import BackStepNew from '@pages/buy/publish/_components/BackStepNew.vue'
// import BackStepEdit from '@pages/buy/publish/basic/_components/BackStepEdit.vue'
import PopupAddressGoogleMap from '@pages/buy/publish/basic/_components/popup/AddressGoogleMap.vue'
import PopupFeature from '@pages/buy/publish/basic/_components/popup/Feature.vue'
import PopupTitleDeed from '@pages/buy/publish/basic/_components/popup/TitleDeed.vue'

import DataComponents from '@pages/buy/publish/basic/_containers/DataComponents.vue'
import SubmitButtons from '@pages/buy/publish/basic/_containers/SubmitButtons.vue'

// import { awaitAllPromise } from '@js/_prototype.js'

// import { useCommonStore } from '@stores/common.js'
import useCommonActions from '@stores/composables/useCommonActions.js'
import { useBuyProjectStore } from '@stores/buy/project.js'
// import { useBuyBasicStore } from '@stores/buy/basic.js'
import useBuyBasicActions from '@stores/buy/composables/useBasicActions.js'
import useBuyPopupActions from '@stores/buy/composables/usePopupActions.js'

import { Form } from 'vee-validate'

definePageMeta({
  layout: 'buy',
  requiresAuth: true,
  title: '物件資料編輯',
})

// const common = useCommonStore()
const { onUseMeta, onWithLoadingAll } = useCommonActions()
const buyProject = useBuyProjectStore()
// const { options } = storeToRefs(buyProject)
// const buyBasic = useBuyBasicStore()
// const { apiData } = storeToRefs(buyBasic)
const { onAllPromise, onApiGETRealEstate, onApiPOSTRealEstateDraft, onApiPOSTRealEstate } =
  useBuyBasicActions()
const { onAlert } = useBuyPopupActions()
const route = useRoute()
const router = useRouter()
const hfID = computed(() => route.params.id)

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
  useAsyncData(`detail-${hfID.value}`, () => onApiGETRealEstate(hfID.value)),
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
      <BackStepNew
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
      <!-- <BackStepEdit
        :anchor="{
          to: {
            name: 'buy-parking-id',
            params: {
              id: hfID,
            },
          },
        }"
      /> -->
    </template>
    <Form
      as="div"
      class="tm:mt-[24px] tm:space-y-[24px] p:mt-[32px] p:space-y-[32px]"
      v-slot="{ validate }"
    >
      <!-- <pre>{{ apiData }}</pre> -->
      <DataComponents />
      <SubmitButtons @click:draft="onDraftSubmit" @click:save="() => onSaveSubmit(validate)" />
    </Form>
  </BuyMContainer>
  <PopupAddressGoogleMap />
  <PopupFeature />
  <PopupTitleDeed />
</template>

<style lang="postcss"></style>
