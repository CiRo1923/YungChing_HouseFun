<script setup>
import Breadcrumbs from '@pages/buy/_components/house/Breadcrumbs.vue'
import Basic from '@pages/buy/_components/house/Basic.vue'
import Focus from '@pages/buy/_components/house/Focus.vue'
import Information from '@pages/buy/_components/house/Information.vue'
import Features from '@pages/buy/_components/house/Features.vue'
import Environment from '@pages/buy/_components/house/Environment.vue'
import Community from '@pages/buy/_components/house/Community.vue'
import HousePrice from '@pages/buy/_components/house/HousePrice.vue'
import ActualPrice from '@pages/buy/_components/house/ActualPrice.vue'
import SocialLife from '@pages/buy/_components/house/SocialLife.vue'
import Selections from '@pages/buy/_components/house/Selections.vue'
import Recommend from '@pages/buy/_components/house/Recommend.vue'
import Construction from '@pages/buy/_components/house/Construction.vue'
import PopupAskMessage from '@pages/buy/_components/house/PopupAskMessage.vue'

import useCommonActions from '@stores/_composables/useCommonActions.js'
import { useBuyHouseStore } from '@stores/buy/house.js'
import useBuyProjectActions from '@stores/buy/_composables/useProjectActions.js'
import useBuyHouseActions from '@stores/buy/_composables/useHouseActions.js'

definePageMeta({
  layout: 'common',
  requiresAuth: false,
})

const { onUseMeta, onWithLoadingAll } = useCommonActions()
const buyHouse = useBuyHouseStore()
const { detail } = storeToRefs(buyHouse)
// const popup = useBuyPopupStore()
const { onApiBuyHouse } = useBuyHouseActions()
const {
  onApiGETRealEstateTypeSelectOptions,
  onApiGETRealEstateParkingModeSelectOptions,
  onApiGETRealEstateParkingRegSelectOptions,
} = useBuyProjectActions()

const route = useRoute()
const seo = computed(() => detail.value?.seo ?? {})

await onWithLoadingAll([
  useAsyncData('type-options', () => onApiGETRealEstateTypeSelectOptions()),
  useAsyncData('parking-mode-options', () => onApiGETRealEstateParkingModeSelectOptions()),
  useAsyncData('parking-reg-options', () => onApiGETRealEstateParkingRegSelectOptions()),
  useAsyncData(`buy-detail-${route.params.hfid}`, () => onApiBuyHouse()),
])

onUseMeta({
  title: seo.value.title,
  description: seo.value.description,
  url: useRequestURL(),
})
</script>

<template>
  <div class="bg-[--white] py-[12px] tm:px-[15px]">
    <CommonMContainer class="--inner">
      <Breadcrumbs />
    </CommonMContainer>
  </div>
  <!-- <pre>
    {{ detail }}
  </pre> -->
  <!-- <pre>
    {{ seo }}
  </pre> -->
  <CommonMContainer class="--inner tm:space-y-[8px] p:mt-[45px] p:space-y-[12px]">
    <Basic />
    <Focus />
    <Information />
    <Features />
    <Environment />
    <Community />
    <HousePrice />
    <ActualPrice />
    <SocialLife />
    <Selections />
    <Recommend />
    <Construction />
  </CommonMContainer>
  <PopupAskMessage />
</template>

<style></style>
