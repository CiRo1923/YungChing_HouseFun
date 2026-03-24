<script setup>
import Container from '@components/common/mContainer.vue'

import Basic from '@pages/buy/_components/house/Basic.vue'
import Focus from '@pages/buy/_components/house/Focus.vue'
import Information from '@pages/buy/_components/house/Information.vue'

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
  </Container>
</template>

<style></style>
