<script setup>
import CardFilter from '@components/buy/mCard/Filter.vue'
import FormLabel from '@components/buy/mForm/Label.vue'

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
  <CardFilter :title="props.title">
    <ul class="tm:space-y-[40px] p:space-y-[24px]">
      <li
        class="tm:space-y-[12px] p:flex p:gap-x-[8px]"
        v-for="(item, index) in items"
        :key="`${item.id}_${index}`"
      >
        <FormLabel
          :label="item.label"
          :config="{
            isRequired: item.isRequired,
          }"
          :setClass="{
            main: ['shrink-0 p:flex p:w-[100px] p:items-center', item.class],
          }"
        />
        <component :is="item.component" />
      </li>
    </ul>
  </CardFilter>
</template>

<style></style>
