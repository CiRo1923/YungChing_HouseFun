<script setup>
const buyHouse = useBuyHouseStore()
const { actualPrice } = storeToRefs(buyHouse)
</script>

<template>
  <PageBuyHouseContent title="周邊實價登錄">
    <ul class="space-y-[10px]">
      <li v-for="(item, index) in actualPrice.items" :key="`${item.id}_${index}`">
        <PageBuyHouseActualPriceContent :item="item" />
      </li>
    </ul>
  </PageBuyHouseContent>
</template>

<style></style>
