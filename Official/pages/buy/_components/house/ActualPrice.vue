<script setup>
const buyHouse = useBuyHouseStore()
const { actualPrice } = storeToRefs(buyHouse)
const hasActualPrice = computed(
  () => actualPrice.value && Object.keys(actualPrice.value).length !== 0
)
</script>

<template>
  <PageBuyHouseContent title="周邊實價登錄" v-if="hasActualPrice">
    <ul class="space-y-[10px]">
      <li v-for="(item, index) in actualPrice.items" :key="`${item.id}_${index}`">
        <PageBuyHouseActualPriceContent :item="item" />
      </li>
    </ul>
  </PageBuyHouseContent>
</template>

<style></style>
