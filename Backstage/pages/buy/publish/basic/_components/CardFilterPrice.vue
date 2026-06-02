<script setup>
import {
  PageBuyPublishBasicPriceCasePrice,
  PageBuyPublishBasicPriceCaseParkingPrice,
  PageBuyPublishBasicPriceCasePriceUnit,
} from '#components'

const props = defineProps({
  title: {
    type: String,
    default: null,
  },
})
const items = shallowReadonly([
  {
    id: 'casePrice',
    isRequired: true,
    label: '總價',
    class: 'p:h-[40px]',
    component: PageBuyPublishBasicPriceCasePrice,
    hasEmits: false,
  },
  {
    id: 'caseParkingPrice',
    isRequired: false,
    label: '車位價',
    class: 'p:h-[40px]',
    component: PageBuyPublishBasicPriceCaseParkingPrice,
    hasEmits: false,
  },
  {
    id: 'casePriceUnit',
    isRequired: false,
    label: '單價',
    class: 'p:h-[40px]',
    component: PageBuyPublishBasicPriceCasePriceUnit,
    hasEmits: false,
  },
])
</script>

<template>
  <PageBuyPublishBasicCardFilter :title="props.title" :items="items" />
</template>

<style></style>
