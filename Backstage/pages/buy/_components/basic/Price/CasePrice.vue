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
    <li class="tm:w-[228px] p:w-[270px]">
      <FormInput
        name="casePrice"
        v-model.number="apiData.casePrice"
        :config="{
          inputMode: 'numeric',
          inputChinese: false,
          checkNotIsZero: true,
          comma: true,
        }"
        :rules="{
          required: '請輸入總價',
        }"
        :setClass="{
          main: '--h-40 --px-12 --py-8',
          element: 'grow',
          rearAssist: 'text-[14px] text-[--gray-999]',
        }"
      >
        <template #rearAssist>萬</template>
      </FormInput>
    </li>
    <li class="flex h-[40px] items-center">
      <FormCheckBox
        name="isCasePriceIncludeParking"
        v-model="apiData.isCasePriceIncludeParking"
        :config="{
          mode: 'boolean',
          label: '含車位',
        }"
        :setClass="{
          label: 'text-[16px]',
        }"
      />
    </li>
  </ul>
</template>

<style></style>
