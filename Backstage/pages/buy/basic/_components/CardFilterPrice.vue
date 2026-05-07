<script setup>
import CasePrice from '@pages/buy/basic/_components/price/CasePrice.vue'
import CaseParkingPrice from '@pages/buy/basic/_components/price/CaseParkingPrice.vue'
import CasePriceUnit from '@pages/buy/basic/_components/price/CasePriceUnit.vue'

import CardFilter from '@pages/buy/basic/_containers/CardFilter.vue'

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
    component: CasePrice,
  },
  {
    id: 'caseParkingPrice',
    isRequired: false,
    label: '車位價',
    class: 'p:h-[40px]',
    component: CaseParkingPrice,
  },
  {
    id: 'casePriceUnit',
    isRequired: false,
    label: '單價',
    class: 'p:h-[40px]',
    component: CasePriceUnit,
  },
])
</script>

<template>
  <CardFilter :title="props.title" :items="items" />
</template>

<style></style>
