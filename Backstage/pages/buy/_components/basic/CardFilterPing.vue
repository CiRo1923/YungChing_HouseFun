<script setup>
import CardFilter from '@pages/buy/_containers/CardFilter.vue'

import CaseSqUnitPin from '@pages/buy/_components/basic/Ping/CaseSqUnitPin.vue'
import CaseBuildSq from '@pages/buy/_components/basic/Ping/CaseBuildSq.vue'
import CaseParkingSq from '@pages/buy/_components/basic/Ping/CaseParkingSq.vue'
import CaseMainSq from '@pages/buy/_components/basic/Ping/CaseMainSq.vue'
import CaseAffiliatedSq from '@pages/buy/_components/basic/Ping/CaseAffiliatedSq.vue'
import CaseLandSq from '@pages/buy/_components/basic/Ping/CaseLandSq.vue'
import CaseAmenitieSq from '@pages/buy/_components/basic/Ping/CaseAmenitieSq.vue'

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
    id: 'caseSqUnitPin',
    isRequired: false,
    label: '顯示單位',
    class: 'p:h-[35px]',
    component: CaseSqUnitPin,
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
  {
    id: 'caseAmenitieSq',
    isRequired: false,
    label: '公設',
    class: 'p:h-[40px]',
    component: CaseAmenitieSq,
  },
  {
    id: 'caseLandSq',
    isRequired: false,
    label: '土地坪數',
    class: 'p:h-[40px]',
    component: CaseLandSq,
  },
])
</script>

<template>
  <!-- <pre>
    {{ pingData }}
  </pre> -->
  <CardFilter :title="props.title" :items="items" />
</template>

<style></style>
