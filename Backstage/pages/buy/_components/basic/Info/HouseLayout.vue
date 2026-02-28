<script setup>
import FormInput from '@components/buy/mForm/Input.vue'
import FormCheckBox from '@components/buy/mForm/CheckBox.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { apiData } = storeToRefs(buyProject)

const items = shallowReadonly([
  {
    id: 'caseRoom',
    label: '房',
    rules: {
      required: '請輸入房數',
    },
  },
  {
    id: 'caseLivingRoom',
    label: '廳',
    rules: {
      required: '請輸入廳數',
    },
  },
  {
    id: 'caseBathroom',
    label: '衛',
    rules: {
      required: '請輸入衛浴數',
    },
  },
  {
    id: 'caseBalcony',
    label: '陽台',
    rules: {
      required: '請輸入陽台數',
    },
  },
])

const onIsCaseAddtionChange = () => {
  if (!apiData.value.isCaseAddtion) {
    apiData.value.caseAddRoom = ''
    apiData.value.caseAddLivingRoom = ''
    apiData.value.caseAddBathroom = ''
    apiData.value.caseAddBalcony = ''
  }
}
</script>

<template>
  <ul class="flex flex-wrap tm:gap-x-[8px] p:gap-x-[24px]">
    <li>
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
              isExistClose: false,
              maxlength: 2,
            }"
            :rules="item.rules"
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
    </li>
    <li class="flex h-[40px] items-center">
      <FormCheckBox
        name="isCaseOpenConcept"
        v-model="apiData.isCaseOpenConcept"
        :config="{
          mode: 'boolean',
          label: '開放式格局',
        }"
        :setClass="{
          label: 'text-[16px]',
        }"
      />
    </li>
    <li class="flex h-[40px] items-center">
      <FormCheckBox
        name="isCaseAddtion"
        v-model="apiData.isCaseAddtion"
        :config="{
          mode: 'boolean',
          label: '有加蓋',
        }"
        :setClass="{
          label: 'text-[16px]',
        }"
        @change="onIsCaseAddtionChange"
      />
    </li>
  </ul>
</template>

<style></style>
