<script setup>
import CardFilter from '@pages/buy/_containers/CardFilter.vue'

// import CaseManageType from '@pages/buy/_components/basic/Feature/CaseManageType.vue'
import CaseDescription from '@pages/buy/_components/basic/Feature/CaseDescription.vue'
// import CaseManagePay from '@pages/buy/_components/basic/Feature/CaseManagePay.vue'

const props = defineProps({
  title: {
    type: String,
    default: null,
  },
})
const items = shallowReadonly([
  {
    id: 'caseDescription',
    component: CaseDescription,
  },
  // {
  //   id: 'caseManageDuty',
  //   isRequired: false,
  //   label: '管理時段',
  //   class: 'p:h-[40px]',
  //   component: CaseManageDuty,
  // },
  // {
  //   id: 'caseManagePay',
  //   isRequired: false,
  //   label: '管理費',
  //   class: 'p:h-[40px]',
  //   component: CaseManagePay,
  // },
])
</script>

<template>
  <CardFilter :title="props.title" :items="items" />
</template>

<style></style>
