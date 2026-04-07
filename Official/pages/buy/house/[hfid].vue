<script setup>
import Container from '@components/common/mContainer.vue'

import Breadcrumbs from '@pages/buy/_components/house/_Breadcrumbs.vue'
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
import { useHouseStore } from '@stores/buy/house.js'
import useProjectStores from '@stores/buy/_composables/useProjectStores.js'
import useHouseStores from '@stores/buy/_composables/useHouseStores.js'

definePageMeta({
  layout: 'common',
  title: '買屋明細',
  channel: 'detail',
  requiresAuth: false,
})

const common = useCommonStore()
const house = useHouseStore()
const { onApiBuyHouse } = useHouseStores()
const route = useRoute()
const { onApiGETRealEstateTypeSelectOptions } = useProjectStores()
const { onWithLoadingAll } = common
const { detail } = storeToRefs(house)
const seo = computed(() => detail.value?.seo ?? {})

await onWithLoadingAll([
  useAsyncData('type-options', () => onApiGETRealEstateTypeSelectOptions()),
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
