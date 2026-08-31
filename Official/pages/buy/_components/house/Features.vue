<script setup>
const buyHouse = useBuyHouseStore()
const { features } = storeToRefs(buyHouse)
const hasFeatures = computed(() => Array.isArray(features.value) && features.value.length > 0)
</script>

<template>
  <PageBuyHouseContent title="特色說明" v-if="hasFeatures" />
</template>
