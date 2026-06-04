<script setup>
const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)
</script>

<template>
  <PageBuyPublishBasicSelectInputOther
    selectName="caseManageTypeToken"
    v-model:select="apiData.caseInfo.caseManageTypeToken"
    otherName="caseManageTypeOther"
    v-model:other="apiData.caseInfo.caseManageTypeOther"
    :config="{
      select: {
        isToOption: true,
        options: options.manageType,
        placeholder: '請選擇管理方式',
        schema: {
          label: 'text',
          value: 'value',
        },
      },
      other: {
        placeholder: '請輸入其他原因',
      },
    }"
    :otherRules="{
      required: '請輸入其他原因',
    }"
    :setClass="{
      main: 'm:space-y-[12px] pt:flex pt:gap-x-[8px]',
      select: {
        main: '--h-40 --px-12 --py-8 t:w-[220px] p:w-[270px]',
      },
      other: {
        main: '--h-40 --px-12 --py-8 t:w-[220px] p:w-[270px]',
      },
    }"
  />
</template>

<style></style>
