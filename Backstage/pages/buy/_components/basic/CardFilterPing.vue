<script setup>
import CardFilter from '@components/buy/mCard/Filter.vue'
import FormLabel from '@components/buy/mForm/Label.vue'

import Unit from '@pages/buy/_components/basic/Ping/Unit.vue'
import CaseBuildSq from '@pages/buy/_components/basic/Ping/CaseBuildSq.vue'
import CaseParkingSq from '@pages/buy/_components/basic/Ping/CaseParkingSq.vue'
import CaseMainSq from '@pages/buy/_components/basic/Ping/CaseMainSq.vue'
import CaseAffiliatedSq from '@pages/buy/_components/basic/Ping/CaseAffiliatedSq.vue'

import { useBuyBasicStore } from '@stores/buy/basic.js'

const buyBasic = useBuyBasicStore()
const { pingData } = storeToRefs(buyBasic)

const props = defineProps({
  title: {
    type: String,
    default: null,
  },
})
const items = shallowReadonly([
  {
    id: 'unit',
    isRequired: false,
    label: '顯示單位',
    class: 'p:h-[35px]',
    component: Unit,
  },
  {
    id: 'caseBuildSq',
    isRequired: true,
    label: '登記坪數',
    class: 'p:h-[40px]',
    component: CaseBuildSq,
  },
  {
    id: 'caseParkingSq',
    isRequired: false,
    label: '車位坪數',
    class: 'p:h-[40px]',
    component: CaseParkingSq,
  },
  {
    id: 'caseMainSq',
    isRequired: false,
    label: '主建物',
    class: 'p:h-[40px]',
    component: CaseMainSq,
  },
  {
    id: 'caseAffiliatedSq',
    isRequired: false,
    label: '附屬建物',
    class: 'p:h-[40px]',
    component: CaseAffiliatedSq,
  },
])
</script>

<template>
  <!-- <pre>
    {{ pingData }}
  </pre> -->
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
