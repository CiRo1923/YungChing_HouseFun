<script setup>
import Info from '@pages/buy/basic/_components/parking/Info.vue'

import CardFilter from '@pages/buy/basic/_containers/CardFilter.vue'

const props = defineProps({
  title: {
    type: String,
    default: null,
  },
})
const items = shallowReadonly([
  {
    id: 'info',
    isRequired: false,
    label: '車位',
    class: 'p:h-[35px]',
    component: Info,
  },
])
</script>

<template>
  <CardFilter :title="props.title" :items="items" />
</template>

<style></style>
