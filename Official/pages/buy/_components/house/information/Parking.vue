<script setup>
import Container from '@pages/buy/_components/house/information/_Container.vue'

const items = computed(() => {
  return [
    [
      {
        id: 'parkingName',
        label: `車位 1`,
        values: [],
      },
      {
        id: 'parkingMode',
        label: '車位類型',
        values: [],
      },
      {
        id: 'parkingType',
        label: '停車方式',
        values: [],
      },
      {
        id: 'parkingFee',
        label: '車位管理費',
        values: [],
      },
    ],
  ]
})
</script>

<template>
  <Container name="parking" :items="items" />
</template>

<style></style>
