<script setup>
import Container from '@components/buy/mContainer.vue'

import BackStepEdit from '~/pages/buy/_components/basic/BackStepEdit.vue'
import DataComponents from '@pages/buy/_containers/basic/DataComponents.vue'
import SubmitButtons from '@pages/buy/_containers/basic/SubmitButtons.vue'

import { awaitAllPromise } from '@js/_prototype.js'

import { useBuyProjectStore } from '@stores/buy/project.js'
import useStores from '@stores/buy/_composables/useStores.js'

import { useBuyBasicAllPromise } from '@pages/buy/_composables/useBuyBasicPage.js'

import { Form } from 'vee-validate'

definePageMeta({
  layout: 'buy',
  requiresAuth: true,
  title: '物件資料編輯',
})

const buyProject = useBuyProjectStore()
const { basic } = useStores()
const { options, apiData } = storeToRefs(buyProject)
const route = useRoute()
const hfID = computed(() => route.params.id)
const detailAsync = useAsyncData(`detail-${hfID.value}`, () => basic.onApiGETRealEstate(hfID.value))

const onDraftSubmit = async () => {
  await basic.onApiPOSTRealEstateDraft(hfID.value)
}

const onSaveSubmit = async (validate) => {
  const { valid } = await validate()

  if (valid) {
    console.log('submit')
    await basic.onApiPOSTRealEstate(hfID.value)
  }
}

await Promise.all([...useBuyBasicAllPromise(), detailAsync])
</script>

<template>
  <Container
    :setClass="{
      main: '--px-16',
    }"
  >
    <template #tools>
      <BackStepEdit />
    </template>
    <Form
      as="div"
      class="tm:mt-[24px] tm:space-y-[24px] p:mt-[32px] p:space-y-[32px]"
      v-slot="{ validate }"
    >
      <!-- <pre>{{ apiData }}</pre> -->
      <DataComponents />
      <SubmitButtons @click:draft="onDraftSubmit" @click:save="onSaveSubmit(validate)" />
    </Form>
  </Container>
</template>

<style></style>
