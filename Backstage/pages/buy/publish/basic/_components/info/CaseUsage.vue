<script setup>
const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)
</script>

<template>
  <BuyMFormSelect
    name="caseUsageToken"
    v-model="apiData.caseInfo.caseUsageToken"
    :options="options.caseUsage"
    :config="{
      placeholder: '請選擇法定用途',
      schema: {
        label: 'text',
        value: 'value',
      },
    }"
    :rules="{
      required: '請選擇法定用途',
    }"
    :setClass="{
      main: '--h-40 --px-12 --py-8',
    }"
  />
</template>

<style></style>
