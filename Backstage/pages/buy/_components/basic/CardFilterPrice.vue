<script setup>
import CardFilter from '@pages/buy/_containers/CardFilter.vue'

import CasePrice from '@pages/buy/_components/basic/Price/CasePrice.vue'
import CaseParkingPrice from '@pages/buy/_components/basic/Price/CaseParkingPrice.vue'
import CasePriceUnit from '@pages/buy/_components/basic/Price/CasePriceUnit.vue'

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
