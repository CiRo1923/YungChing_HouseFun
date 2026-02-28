<script setup>
import CardFilter from '@pages/buy/_containers/CardFilter.vue'

import Info from '@pages/buy/_components/basic/Parking/Info.vue'

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
