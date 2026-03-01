<script setup>
import Container from '@components/buy/mContainer.vue'

import BackStepNew from '~/pages/buy/_components/basic/BackStepNew.vue'
import TabCheck from '@pages/buy/_components/basic/TabCheck.vue'
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
  title: '出售物件刊登',
})

const buyProject = useBuyProjectStore()
const { basic } = useStores()
const { options, apiData } = storeToRefs(buyProject)
const route = useRoute()
const hfID = computed(() => route.params.id || '0')

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

await awaitAllPromise(useBuyBasicAllPromise())
</script>

<template>
  <Container
    :setClass="{
      main: '--px-16',
    }"
  >
    <template #tools>
      <BackStepNew :active="0" />
    </template>
    <TabCheck />
    <Form
      as="div"
      class="tm:mt-[24px] tm:space-y-[24px] p:mt-[32px] p:space-y-[32px]"
      v-slot="{ validate }"
    >
      <!-- <pre>{{ apiData }}</pre> -->
      <DataComponents />
      <SubmitButtons @click:draft="onDraftSubmit" @click:save="() => onSaveSubmit(validate)" />
    </Form>
  </Container>
</template>

<style></style>
