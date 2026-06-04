<script setup>
const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)
</script>

<template>
  <PageBuyPublishBasicSelectInputOther
    selectName="caseUsageToken"
    v-model:select="apiData.caseInfo.caseUsageToken"
    otherName="caseUsageOther"
    v-model:other="apiData.caseInfo.caseUsageOther"
    :config="{
      select: {
        options: options.caseUsage,
        placeholder: '請選擇法定用途',
        schema: {
          label: 'text',
          value: 'value',
        },
      },
      other: {
        placeholder: '請輸入其他原因',
      },
    }"
    :selectRules="{
      required: '請選擇法定用途',
    }"
    :otherRules="{
      required: '請輸入其他原因',
    }"
    :setClass="{
      main: 'm:space-y-[12px] pt:flex pt:gap-x-[8px]',
      select: {
        main: '--h-40 --px-12 --py-8 pt:flex-1',
      },
      other: {
        main: '--h-40 --px-12 --py-8 pt:flex-1',
      },
    }"
  />
</template>

<style></style>
