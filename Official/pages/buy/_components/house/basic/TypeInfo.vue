<script setup>
const buyHouse = useBuyHouseStore()
const { basic } = storeToRefs(buyHouse)
</script>

<template>
  <div class="flex h-[45px] items-center justify-center gap-x-[10px] rounded-[5px] bg-[--gray-f7]">
    <CommonSvgIcon icon="icon_house_o" class="h-[20px] w-[20px] p-[2px] text-[--green-8b0d]" />
    {{ basic.caseType }}
  </div>
</template>

<style lang="postcss"></style>
