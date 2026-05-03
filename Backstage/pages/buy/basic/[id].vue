<script setup>
import BackStepEdit from '@pages/buy/_components/basic/BackStepEdit.vue'
import PopupFeature from '@pages/buy/_components/basic/popup/Feature.vue'
import PopupTitleDeed from '@pages/buy/_components/basic/popup/TitleDeed.vue'

import DataComponents from '@pages/buy/_containers/basic/DataComponents.vue'
import SubmitButtons from '@pages/buy/_containers/basic/SubmitButtons.vue'

// import { awaitAllPromise } from '@js/_prototype.js'

// import { useCommonStore } from '@stores/common.js'
import useCommonActions from '@stores/composables/useCommonActions.js'
// import { useBuyProjectStore } from '@stores/buy/project.js'
// import { useBuyBasicStore } from '@stores/buy/basic.js'
import useBuyBasicActions from '@stores/buy/composables/useBasicActions.js'

import { Form } from 'vee-validate'

definePageMeta({
  layout: 'buy',
  requiresAuth: true,
  title: '物件資料編輯',
})

// const common = useCommonStore()
const { onWithLoadingAll } = useCommonActions()
// const buyProject = useBuyProjectStore()
// const { options } = storeToRefs(buyProject)
// const buyBasic = useBuyBasicStore()
// const { apiData } = storeToRefs(buyBasic)
const { onAllPromise, onApiGETRealEstate, onApiPOSTRealEstateDraft, onApiPOSTRealEstate } =
  useBuyBasicActions()
const route = useRoute()
const hfID = computed(() => route.params.id)
const detailAsync = useAsyncData(`detail-${hfID.value}`, () => onApiGETRealEstate(hfID.value))

const onDraftSubmit = async () => {
  await onApiPOSTRealEstateDraft(hfID.value)
}

const onSaveSubmit = async (validate) => {
  const { valid } = await validate()

  if (valid) {
    await onApiPOSTRealEstate(hfID.value)
  }
}

await onWithLoadingAll([...onAllPromise(), detailAsync])
</script>

<template>
  <BuyMContainer
    :setClass="{
      main: '--px-16',
    }"
  >
    <template #tools>
      <BackStepEdit
        :anchor="{
          to: {
            name: 'buy-parking-id',
            params: {
              id: hfID,
            },
          },
        }"
      />
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
  <PopupFeature />
  <PopupTitleDeed />
</template>

<style></style>
