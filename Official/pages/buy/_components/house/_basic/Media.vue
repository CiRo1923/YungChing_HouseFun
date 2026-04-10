<script setup>
import MediaImages from '@pages/buy/_components/house/_basic/MediaImages.vue'

// import { useBuyHouseStore } from '@stores/buy/house.js'

// const buyHouse = useBuyHouseStore()
// const { media } = storeToRefs(buyHouse)
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
