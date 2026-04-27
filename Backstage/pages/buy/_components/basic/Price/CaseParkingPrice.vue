<script setup>
import { useBuyBasicStore } from '@stores/buy/basic.js'

const buyBasic = useBuyBasicStore()
const { apiData } = storeToRefs(buyBasic)

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
  <BuyMFormInput
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
  </BuyMFormInput>
</template>

<style></style>
