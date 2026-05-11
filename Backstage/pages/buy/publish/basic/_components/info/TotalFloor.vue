<script setup>
// import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyPublishStore } from '@stores/buy/publish.js'

// const buyProject = useBuyProjectStore()
// const { options } = storeToRefs(buyProject)
const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)
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
      main: '--h-40 --px-12 --py-8 t:w-[90px] p:w-[100px]',
      element: 'grow',
      rearAssist: 'text-[14px] text-[--gray-999]',
    }"
  >
    <template #rearAssist>樓</template>
  </BuyMFormInput>
</template>

<style></style>
