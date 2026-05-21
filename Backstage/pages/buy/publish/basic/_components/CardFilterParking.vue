<script setup>
import { PageBuyPublishBasicParkingInfo } from '#components'

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
    component: PageBuyPublishBasicParkingInfo,
  },
])
</script>

<template>
  <PageBuyPublishBasicCardFilter :title="props.title" :items="items" />
</template>

<style></style>
