<script setup>
import CaseManageType from '@pages/buy/basic/_components/manage/CaseManageType.vue'
import CaseManageDuty from '@pages/buy/basic/_components/manage/CaseManageDuty.vue'
import CaseManagePay from '@pages/buy/basic/_components/manage/CaseManagePay.vue'

import CardFilter from '@pages/buy/basic/_containers/CardFilter.vue'

const props = defineProps({
  title: {
    type: String,
    default: null,
  },
})
const items = shallowReadonly([
  {
    id: 'caseManageType',
    isRequired: false,
    label: '管理方式',
    class: 'p:h-[40px]',
    component: CaseManageType,
  },
  {
    id: 'caseManageDuty',
    isRequired: false,
    label: '管理時段',
    class: 'p:h-[40px]',
    component: CaseManageDuty,
  },
  {
    id: 'caseManagePay',
    isRequired: false,
    label: '管理費',
    class: 'p:h-[40px]',
    component: CaseManagePay,
  },
])
</script>

<template>
  <CardFilter :title="props.title" :items="items" />
</template>

<style></style>
