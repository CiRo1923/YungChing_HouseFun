<script setup>
import TabDefaultOval from '@components/buy/mTab/DefaultOval.vue'

// const route = useRoute()
const items = readonly([
  {
    id: 'region',
    label: '區域找房',
    icon: 'icon_loaction',
    to: {
      name: 'buy-region-page',
      params: {
        page: 1,
      },
    },
  },
  {
    id: 'mrt',
    label: '捷運找房',
    icon: 'icon_mrt',
    to: {
      name: 'buy-mrt-page',
      params: {
        page: 1,
      },
    },
  },
  {
    id: 'map',
    label: '地圖找房',
    icon: 'icon_map',
  },
])

// const activeIndex =
</script>

<template>
  <TabDefaultOval
    :items="items"
    :config="{
      containerMode: 'single',
    }"
    :setClass="{
      main: '--anchor-height-50 --green-8b0d mx-auto p:max-w-[1200px]',
      headerItem: 'm:flex-1',
      anchor: 'm:w-full p:w-[160px]',
    }"
  />
</template>

<style></style>
