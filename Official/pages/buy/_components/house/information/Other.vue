<script setup>
import Container from '@pages/buy/_components/house/information/_Container.vue'

const items = computed(() => {
  return [
    [
      {
        id: 'structure',
        label: '結構',
        values: [],
      },
      {
        id: 'elevator',
        label: '電梯',
        value: ``,
      },
      {
        id: 'manageType',
        label: '管理方式',
        value: ``,
      },
      {
        id: 'manageFeePeriod',
        label: '管理費',
        values: [],
      },
    ],
    [
      {
        id: 'face',
        label: '朝向',
        values: [],
      },
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
  <Container name="other" :items="items" />
</template>

<style></style>
