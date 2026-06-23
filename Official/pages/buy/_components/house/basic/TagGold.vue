<script setup>
const buyHouse = useBuyHouseStore()
const { badges } = storeToRefs(buyHouse)
</script>

<template>
  <BuyMTagDefault
    label="黃金曝光"
    :setClass="{
      main: '--rounded-3 --bg-red-e45c --text-white --text-shadow --px-6 --py-4 shrink-0',
      label: 'tm:text-[12px] p:text-[14px]',
    }"
    v-if="badges.gold"
  />
</template>

<style lang="postcss"></style>
