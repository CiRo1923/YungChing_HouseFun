<script setup>
const buyHouse = useBuyHouseStore()
const { community } = storeToRefs(buyHouse)
</script>

<template>
  <div
    class="overflow-hidden rounded-[10px] bg-[--gray-f2] m:h-[244px] pt:h-[214px] pt:w-[170px] pt:shrink-0"
  >
    <CommonImgSrc
      :src="community.imageUrl"
      :setClass="{
        main: 'h-full w-full',
      }"
    />
  </div>
</template>

<style lang="postcss"></style>
