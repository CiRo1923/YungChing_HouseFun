<script setup>
// import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyBasicStore } from '@stores/buy/basic.js'

// const buyProject = useBuyProjectStore()
// const { options } = storeToRefs(buyProject)
const buyBasic = useBuyBasicStore()
const { apiData } = storeToRefs(buyBasic)
</script>

<template>
  <BuyMFormInput
    name="caseFloorTotal"
    v-model.number="apiData.caseInfo.caseFloorTotal"
    :config="{
      inputMode: 'numeric',
      inputChinese: false,
      checkNotIsZero: true,
      integer: true,
      isExistClose: false,
    }"
    :rules="{
      required: '請輸入總樓高',
    }"
    :setClass="{
      main: '--h-40 --px-12 --py-8 p:w-[100px]',
      element: 'grow',
      rearAssist: 'text-[14px] text-[--gray-999]',
    }"
  >
    <template #rearAssist>樓</template>
  </BuyMFormInput>
</template>

<style></style>
