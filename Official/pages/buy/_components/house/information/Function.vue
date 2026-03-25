<script setup>
import Container from '@pages/buy/_components/house/information/_Container.vue'

const items = computed(() => {
  return [
    [
      {
        id: 'function',
        label: '交通機能',
        values: [],
      },
    ],
    [
      {
        id: 'school',
        label: '附近國中小',
        values: [],
      },
    ],
  ]
})
</script>

<template>
  <Container name="function" :items="items" />
</template>

<style></style>
