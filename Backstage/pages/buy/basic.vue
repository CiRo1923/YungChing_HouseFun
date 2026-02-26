<script setup>
import Container from '@components/buy/mContainer.vue'

import BackStep from '@pages/buy/_components/basic/BackStep.vue'
import TabCheck from '@pages/buy/_components/basic/TabCheck.vue'
import CardFilterInfo from '@pages/buy/_components/basic/CardFilterInfo.vue'
import CardFilterPrice from '@pages/buy/_components/basic/CardFilterPrice.vue'
import CardFilterPing from '@pages/buy/_components/basic/CardFilterPing.vue'
import CardFilterManage from '@pages/buy/_components/basic/CardFilterManage.vue'

import { awaitAllPromise } from '@js/_prototype.js'

import { useBuyProjectStore } from '@stores/buy/project.js'
import useStores from '@stores/buy/_composables/useStores.js'

import { Form } from 'vee-validate'

definePageMeta({
  layout: 'buy',
  requiresAuth: true,
  title: '出售物件刊登',
})

const buyProject = useBuyProjectStore()
const { project } = useStores()
const { options, apiData } = storeToRefs(buyProject)

const datas = shallowReadonly([
  {
    id: 'cardFilterInfo',
    label: '基本資料',
    component: CardFilterInfo,
  },
  {
    id: 'cardFilterPrice',
    label: '價格資訊',
    component: CardFilterPrice,
  },
  {
    id: 'cardFilterPing',
    label: '坪數資訊',
    component: CardFilterPing,
  },
  {
    id: 'cardFilterManage',
    label: '管理資訊',
    component: CardFilterManage,
  },
])

const onSubmit = async (validate) => {
  const { valid } = await validate()

  if (valid) {
    console.log('submit')
  }
}

await awaitAllPromise([
  useAsyncData('purpose-options', () => project.onApiGETRealEstatePurposeCheckOptions()),
  useAsyncData('city-options', () => project.onApiGETCitySelectOptions()),
  useAsyncData('type-options', () => project.onApiGETRealEstateTypeSelectOptions()),
  useAsyncData('usage-options', () => project.onApiGETRealEstateLegalUsageSelectOptions()),
  useAsyncData('zoing-options', () => project.onApiGETRealEstateZoingCheckOptions()),
  useAsyncData('zoingCity-options', () => project.onApiGETRealEstateZoingCitySelectOptions()),
  useAsyncData('zoingLand-options', () => project.onApiGETRealEstateZoingLandSelectOptions()),
  useAsyncData('floor-options', () => project.onApiGETRealEstateFloorSelectOptions()),
  useAsyncData('face-options', () => project.onApiGETRealEstateFaceSelectOptions()),
  useAsyncData('structure-options', () => project.onApiGETRealEstateStructionSelectOptions()),
  useAsyncData('barrierFree-options', () => project.onApiGETRealEstateBarrierFreeCheckOptions()),
  useAsyncData('manageType-options', () => project.onApiGETRealEstateManageTypeSelectOpstions()),
  useAsyncData('manageDuty-options', () => project.onApiGETRealEstateManageDutySelectOpstions()),
  useAsyncData('managePay-options', () =>
    project.onApiGETRealEstateManagePayPeriodSelectOpstions()
  ),
])
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
      <!-- <pre>{{ apiData }}</pre> -->
      <ul class="tm:space-y-[24px] p:space-y-[32px]">
        <li v-for="(item, index) in datas" :key="`${item.id}_${index}`">
          <component :title="item.label" :is="item.component" />
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
