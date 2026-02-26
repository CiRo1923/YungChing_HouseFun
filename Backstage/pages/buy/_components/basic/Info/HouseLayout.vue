<script setup>
import FormInput from '@components/buy/mForm/Input.vue'
import FormCheckBox from '@components/buy/mForm/CheckBox.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { apiData } = storeToRefs(buyProject)

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
        <li>
          <FormInput
            name="caseRoom"
            v-model="apiData.caseRoom"
            :config="{
              isExistClose: false,
              maxlength: 2,
            }"
            :rules="{
              required: '請輸入房數',
            }"
            :setClass="{
              main: '--height-40 --px-12 --py-8 tm:w-[151px] p:w-[100px]',
              element: 'grow',
              rearAssist: 'text-[14px] text-[--gray-999]',
            }"
          >
            <template #rearAssist>房</template>
          </FormInput>
        </li>
        <li>
          <FormInput
            name="caseLivingRoom"
            v-model="apiData.caseLivingRoom"
            :config="{
              isExistClose: false,
              maxlength: 2,
            }"
            :rules="{
              required: '請輸入廳數',
            }"
            :setClass="{
              main: '--height-40 --px-12 --py-8 tm:w-[151px] p:w-[100px]',
              element: 'grow',
              rearAssist: 'text-[14px] text-[--gray-999]',
            }"
          >
            <template #rearAssist>廳</template>
          </FormInput>
        </li>
        <li>
          <FormInput
            name="caseBathroom"
            v-model="apiData.caseBathroom"
            :config="{
              isExistClose: false,
              maxlength: 2,
            }"
            :rules="{
              required: '請輸入衛浴數',
            }"
            :setClass="{
              main: '--height-40 --px-12 --py-8 tm:w-[151px] p:w-[100px]',
              element: 'grow',
              rearAssist: 'text-[14px] text-[--gray-999]',
            }"
          >
            <template #rearAssist>衛</template>
          </FormInput>
        </li>
        <li>
          <FormInput
            name="caseBalcony"
            v-model="apiData.caseBalcony"
            :config="{
              isExistClose: false,
              maxlength: 2,
            }"
            :rules="{
              required: '請輸入衛浴數',
            }"
            :setClass="{
              main: '--height-40 --px-12 --py-8 tm:w-[151px] p:w-[110px]',
              element: 'grow',
              rearAssist: 'text-[14px] text-[--gray-999]',
            }"
          >
            <template #rearAssist>陽台</template>
          </FormInput>
        </li>
      </ul>
    </li>
    <li class="flex h-[40px] items-center">
      <FormCheckBox
        name="isCaseOpenConcept"
        v-model="apiData.isCaseOpenConcept"
        :config="{
          label: '開放式格局',
          value: {
            true: true,
            false: false,
          },
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
          label: '有加蓋',
          value: {
            true: true,
            false: false,
          },
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
