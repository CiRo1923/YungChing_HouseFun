<script setup>
const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)
</script>

<template>
  <BuyMFormRadiosOval
    name="casePurposeToken"
    v-model.number="apiData.caseInfo.casePurposeToken"
    :options="options.casePurpose"
    :config="{
      schema: {
        label: 'text',
        value: 'code',
      },
    }"
    :rules="{
      required: '請選擇現況',
    }"
  />
</template>

<style></style>
