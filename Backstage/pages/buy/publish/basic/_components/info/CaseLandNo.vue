<script setup>
// const buyProject = useBuyProjectStore()
// const { options } = storeToRefs(buyProject)
const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)
</script>

<template>
  <CommonMFormInput
    name="caseLandNo"
    v-model="apiData.caseInfo.caseLandNo"
    :config="{
      placeholder: '請輸入地號',
    }"
    :rules="{
      required: '請輸入地號',
    }"
    :setClass="{
      type: 'text-[16px]',
      main: '--h-40 --px-12 --py-8',
    }"
  />
</template>
