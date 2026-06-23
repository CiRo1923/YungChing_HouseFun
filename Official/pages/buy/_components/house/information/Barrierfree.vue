<script setup>
// const buyHouse = useBuyHouseStore()
// const { basic, pricing } = storeToRefs(buyHouse)

const items = computed(() => {
  return [
    [
      {
        id: 'barrierfree',
        label: '無障礙空間',
        values: [],
      },
    ],
  ]
})
</script>

<template>
  <PageBuyHouseInformationContainer name="other" :items="items" />
</template>

<style></style>
