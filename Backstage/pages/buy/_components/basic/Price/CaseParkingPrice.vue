<script setup>
import FormInput from '@components/buy/mForm/Input.vue'

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
      <FormInput
        name="caseParkingPrice"
        v-model="apiData.caseParkingPrice"
        :config="{
          inputMode: 'numeric',
          inputChinese: false,
          checkNotIsZero: true,
          comma: true,
        }"
        :setClass="{
          main: '--height-40 --px-12 --py-8 p:w-[270px]',
          element: 'grow',
          rearAssist: 'text-[14px] text-[--gray-999]',
        }"
      >
        <template #rearAssist>萬</template>
      </FormInput>
    </li>
  </ul>
</template>

<style></style>
