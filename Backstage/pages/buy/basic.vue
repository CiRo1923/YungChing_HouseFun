<script setup>
import Container from '@components/buy/mContainer.vue'

import BackStep from '@pages/buy/_components/basic/BackStep.vue'
import TabCheck from '@pages/buy/_components/basic/TabCheck.vue'
import CardFilterInfo from '@pages/buy/_components/basic/CardFilterInfo.vue'

import { awaitAllPromise } from '@js/_prototype.js'

import { useBuyProjectStore } from '@stores/buy/project.js'

import { Form } from 'vee-validate'

definePageMeta({
  layout: 'buy',
  requiresAuth: true,
  title: '出售物件刊登',
})

const buyProject = useBuyProjectStore()
const { options, apiData } = storeToRefs(buyProject)
await awaitAllPromise([
  useAsyncData('purpose-options', () => buyProject.onApiGETRealEstatePurposeCheckOptions()),
  useAsyncData('city-options', () => buyProject.onApiGETCitySelectOptions()),
  useAsyncData('type-options', () => buyProject.onApiGETRealEstateTypeSelectOptions()),
  useAsyncData('usage-options', () => buyProject.onApiGETRealEstateLegalUsageSelectOptions()),
  useAsyncData('zoing-options', () => buyProject.onApiGETRealEstateZoingCheckOptions()),
  useAsyncData('zoingCity-options', () => buyProject.onApiGETRealEstateZoingCitySelectOptions()),
  useAsyncData('zoingLand-options', () => buyProject.onApiGETRealEstateZoingLandSelectOptions()),
  useAsyncData('floor-options', () => buyProject.onApiGETRealEstateFloorSelectOptions()),
])

const onSubmit = async (validate) => {
  const { valid } = await validate()

  if (valid) {
    console.log('submit')
  }
}
</script>

<template>
  <Container
    :setClass="{
      main: '--px-16',
    }"
  >
    <template #tools>
      <BackStep :active="0" />
    </template>
    <TabCheck />
    <Form as="div" class="tm:mt-[24px] p:mt-[32px]" v-slot="{ validate }">
      <pre>{{ apiData }}</pre>
      <ul class="tm:space-y-[24px] p:space-y-[32px]">
        <li>
          <!-- 基本資料 -->
          <CardFilterInfo />
        </li>
      </ul>
      <div class="tm:mt-[24px] p:mt-[32px]">
        <button type="button" @click="onSubmit(validate)">next</button>
      </div>
    </Form>
    <NuxtLink
      :to="{
        name: 'buy-parking',
      }"
    >
      parking
    </NuxtLink>

    <!-- <pre>
      {{ options }}
    </pre> -->
    <!-- <pre>{{ data.caseInfo }}</pre> -->
    <!-- <pre v-if="res.data">{{ JSON.stringify(res.data, null, 2) }}</pre> -->
  </Container>
</template>

<style></style>
