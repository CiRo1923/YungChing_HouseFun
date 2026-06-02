<script setup>
import {
  PageBuyPublishBasicManageCaseManageType,
  PageBuyPublishBasicManageCaseManageDuty,
  PageBuyPublishBasicManageCaseManagePay,
} from '#components'

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
    component: PageBuyPublishBasicManageCaseManageType,
    hasEmits: false,
  },
  {
    id: 'caseManageDuty',
    isRequired: false,
    label: '管理時段',
    class: 'p:h-[40px]',
    component: PageBuyPublishBasicManageCaseManageDuty,
    hasEmits: false,
  },
  {
    id: 'caseManagePay',
    isRequired: false,
    label: '管理費',
    class: 'p:h-[40px]',
    component: PageBuyPublishBasicManageCaseManagePay,
    hasEmits: false,
  },
])
</script>

<template>
  <PageBuyPublishBasicCardFilter :title="props.title" :items="items" />
</template>

<style></style>
