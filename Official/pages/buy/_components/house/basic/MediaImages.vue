<script setup>
import Swiper12 from '@components/buy/mSwiper12.vue'

import { useHouseStore } from '@stores/buy/house.js'

const house = useHouseStore()
const { media } = storeToRefs(house)
const testImages = [1, 2, 3, 4]
const hasImages = computed(() => media.value.images && media.value.images.length !== 0)
const images = computed(() => (hasImages.value ? media.value.images : testImages))
</script>

<template>
  <Swiper12
    name="houseMediaImages"
    :data="images"
    :config="{
      nav: true,
    }"
    :setClass="{
      main: 'h-full',
      nav: 'h-[30px] w-[30px] p-[6px] text-[--white]',
    }"
    v-slot="{ item }"
  >
    <div class="flex h-full flex-col items-center justify-center">Image {{ item }}</div>
  </Swiper12>
</template>

<style></style>
