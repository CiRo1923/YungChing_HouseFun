<script setup>
import CardFilter from '@components/buy/mCard/Filter.vue'
import FormLabel from '@components/buy/mForm/Label.vue'

import CaseManageType from '@pages/buy/_components/basic/Manage/CaseManageType.vue'
import CaseManageDuty from '@pages/buy/_components/basic/Manage/CaseManageDuty.vue'
import CaseManagePay from '@pages/buy/_components/basic/Manage/CaseManagePay.vue'

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
