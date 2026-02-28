<script setup>
import FormInput from '@components/buy/mForm/Input.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { apiData } = storeToRefs(buyProject)

const items = shallowReadonly([
  {
    id: 'caseAddRoom',
    label: '房',
  },
  {
    id: 'caseAddLivingRoom',
    label: '廳',
  },
  {
    id: 'caseAddBathroom',
    label: '衛',
  },
  {
    id: 'caseAddBalcony',
    label: '陽台',
  },
])
</script>

<template>
  <ul class="flex flex-wrap gap-x-[8px] gap-y-[12px]">
    <li
      class="tm:w-[151px] p:w-[100px]"
      v-for="(item, index) in items"
      :key="`${item.id}_${index}`"
    >
      <FormInput
        :name="item.id"
        v-model="apiData[item.id]"
        :config="{
          inputMode: 'numeric',
          inputChinese: false,
          checkNotIsZero: true,
          integer: true,
          maxlength: 2,
          isExistClose: false,
          isDisabled: !apiData.isCaseAddtion,
        }"
        :setClass="{
          main: '--h-40 --px-12 --py-8',
          element: 'grow',
          rearAssist: 'text-[14px] text-[--gray-999]',
        }"
      >
        <template #rearAssist>{{ item.label }}</template>
      </FormInput>
    </li>
  </ul>
</template>

<style></style>
