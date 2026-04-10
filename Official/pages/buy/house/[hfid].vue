<script setup>
import Container from '@components/common/mContainer.vue'

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

import { useMeta } from '@composable/useMeta.js'

import { useCommonStore } from '@stores/common.js'
import { useBuyHouseStore } from '@stores/buy/house.js'
import useBuyProjectStores from '@stores/buy/_composables/useProjectStores.js'
import useBuyHouseStores from '@stores/buy/_composables/useHouseStores.js'

definePageMeta({
  layout: 'common',
  requiresAuth: false,
})

const common = useCommonStore()
const { onWithLoadingAll } = common
const buyHouse = useBuyHouseStore()
const { detail } = storeToRefs(buyHouse)
const { onApiBuyHouse } = useBuyHouseStores()
const {
  onApiGETRealEstateTypeSelectOptions,
  onApiGETRealEstateParkingModeSelectOptions,
  onApiGETRealEstateParkingRegSelectOptions,
} = useBuyProjectStores()

const route = useRoute()
const seo = computed(() => detail.value?.seo ?? {})

await onWithLoadingAll([
  useAsyncData('type-options', () => onApiGETRealEstateTypeSelectOptions()),
  useAsyncData('parking-mode-options', () => onApiGETRealEstateParkingModeSelectOptions()),
  useAsyncData('parking-reg-options', () => onApiGETRealEstateParkingRegSelectOptions()),
  useAsyncData(`buy-detail-${route.params.hfid}`, () => onApiBuyHouse()),
])

useMeta({
  title: seo.value.title,
  description: seo.value.description,
  url: useRequestURL(),
})
</script>

<template>
  <div class="bg-[--white] py-[12px] tm:px-[15px]">
    <Container class="--inner">
      <Breadcrumbs />
    </Container>
  </div>
  <!-- <pre>
    {{ detail }}
  </pre> -->
  <!-- <pre>
    {{ seo }}
  </pre> -->
  <Container class="--inner tm:space-y-[8px] p:mt-[45px] p:space-y-[12px]">
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
  </Container>
</template>

<style></style>
