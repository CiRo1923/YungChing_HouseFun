<script setup>
import MediaImages from '@pages/buy/_components/house/basic/MediaImages.vue'

import { useHouseStore } from '@stores/buy/house.js'

const house = useHouseStore()
const { media } = storeToRefs(house)
</script>

<template>
  <div
    class="relative w-full overflow-hidden bg-[--gray-999] m:mb-[6px] m:h-[270px] m:w-full pt:h-[570px] pt:rounded-[10px]"
  >
    <!-- <pre> {{ media }}</pre> -->
    <MediaImages />
  </div>
</template>

<style></style>
