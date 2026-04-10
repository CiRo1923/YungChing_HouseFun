<script setup>
import FormInput from '@components/buy/mForm/Input.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { apiData } = storeToRefs(buyProject)

// const onIsCaseAddtionChange = () => {
//   if (!apiData.value.caseInfo.isCaseAddtion) {
//     apiData.value.caseInfo.caseAddRoom = ''
//     apiData.value.caseInfo.caseAddLivingRoom = ''
//     apiData.value.caseInfo.caseAddBathroom = ''
//     apiData.value.caseInfo.caseAddBalcony = ''
//   }
// }
</script>

<template>
  <FormInput
    name="caseParkingPrice"
    v-model.number="apiData.caseInfo.caseParkingPrice"
    :config="{
      inputMode: 'numeric',
      inputChinese: false,
      checkNotIsZero: true,
      comma: true,
    }"
    :setClass="{
      main: '--h-40 --px-12 --py-8 p:w-[270px]',
      element: 'grow',
      rearAssist: 'text-[14px] text-[--gray-999]',
    }"
  >
    <template #rearAssist>萬</template>
  </FormInput>
</template>

<style></style>
