<script setup>
import Container from '@components/buy/mContainer.vue'
import CardDefault from '@components/buy/mCard/Default.vue'
import Anchor from '@components/buy/mAnchor.vue'

import BackStep from '@pages/buy/_components/basic/BackStep.vue'
import TabCheck from '@pages/buy/_components/basic/TabCheck.vue'
import CardFilterInfo from '@pages/buy/_components/basic/CardFilterInfo.vue'
import CardFilterPrice from '@pages/buy/_components/basic/CardFilterPrice.vue'
import CardFilterPing from '@pages/buy/_components/basic/CardFilterPing.vue'
import CardFilterManage from '@pages/buy/_components/basic/CardFilterManage.vue'
import CardFilterFeature from '@pages/buy/_components/basic/CardFilterFeature.vue'
import CardFilterMedia from '@pages/buy/_components/basic/CardFilterMedia.vue'
import CardFilterParking from '@pages/buy/_components/basic/CardFilterParking.vue'
import CardFilterPosterInfo from '@pages/buy/_components/basic/CardFilterPosterInfo.vue'
import CardFilterTerms from '@pages/buy/_components/basic/CardFilterTerms.vue'

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
  {
    id: 'cardFilterParking',
    label: '車位資訊',
    component: CardFilterParking,
  },
  {
    id: 'cardFilterFeature',
    label: '特色描述',
    component: CardFilterFeature,
  },
  {
    id: 'cardFilterMedia',
    label: '影音設定',
    component: CardFilterMedia,
  },
  {
    id: 'cardFilterPosterInfo',
    label: '聯絡資訊',
    component: CardFilterPosterInfo,
  },
  {
    id: 'cardFilterTerms',
    label: '使用條款',
    component: CardFilterTerms,
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
  useAsyncData('parkingMode-options', () => project.onApiGETRealEstateParkingModeSelectOptions()),
  useAsyncData('parkingType-options', () => project.onApiGETRealEstateParkingTypeSelectOpstions()),
  useAsyncData('parkingReg-options', () => project.onApiGETRealEstateParkingRegSelectOpstions()),
  useAsyncData('parkingPayPeriod-options', () =>
    project.onApiGETRealEstateParkingPayPeriodSelectOpstions()
  ),
  useAsyncData('videoType-options', () => project.onApiGETRealEstateVideoTypeSelectOpstions()),
  useAsyncData('feature-options', () => project.onApiGETRealEstateFeatureCheckOptions()),
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
    <Form
      as="div"
      class="tm:mt-[24px] tm:space-y-[24px] p:mt-[32px] p:space-y-[32px]"
      v-slot="{ validate }"
    >
      <!-- <pre>{{ apiData }}</pre> -->
      <ul class="tm:space-y-[24px] p:space-y-[32px]">
        <li v-for="(item, index) in datas" :key="`${item.id}_${index}`">
          <component :title="item.label" :is="item.component" />
        </li>
      </ul>
      <CardDefault class="text-center">
        <ul class="inline-flex m:flex-col-reverse m:gap-y-[24px] pt:items-center pt:gap-x-[24px]">
          <li>
            <Anchor
              text="取消"
              :setClass="{
                main: ' --border-gray-e5 --bg-white --oval --h-45 --px-30 --py-8 --text-gray-666 shrink-0',
                text: 'font-semibold',
              }"
            />
          </li>
          <li>
            <Anchor
              text="存成草稿"
              :setClass="{
                main: ' --border-gray-e5 --bg-white --oval --h-45 --px-30 --py-8 --text-gray-666 shrink-0',
                text: 'font-semibold',
              }"
            />
          </li>
          <li>
            <Anchor
              text="儲存，選擇刊登額度"
              :setClass="{
                main: '  --bg-green-6a2d --oval --h-45 --px-30 --py-8 --text-white shrink-0',
                text: 'font-semibold',
              }"
              @click="onSubmit(validate)"
            />
          </li>
        </ul>
      </CardDefault>
    </Form>
    <!-- <NuxtLink
      :to="{
        name: 'buy-parking',
      }"
    >
      parking
    </NuxtLink> -->

    <!-- <pre>
      {{ options }}
    </pre> -->
    <!-- <pre>{{ data.caseInfo }}</pre> -->
    <!-- <pre v-if="res.data">{{ JSON.stringify(res.data, null, 2) }}</pre> -->
  </Container>
</template>

<style></style>
