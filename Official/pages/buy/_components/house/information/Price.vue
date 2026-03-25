<script setup>
import Container from '@pages/buy/_components/house/information/_Container.vue'

const items = computed(() => {
  return [
    [
      {
        id: 'priceUnit',
        label: '單價',
        values: [],
      },
    ],
    [
      {
        id: 'loan',
        label: '房貸月付',
        values: [],
      },
    ],
  ]
})
</script>

<template>
  <Container name="price" :items="items" />
</template>

<style></style>
