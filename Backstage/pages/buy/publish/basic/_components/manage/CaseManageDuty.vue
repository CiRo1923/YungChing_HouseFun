<script setup>
const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)
</script>

<template>
  <PageBuyPublishBasicSelectInputOther
    selectName="caseManageDutyToken"
    v-model:select="apiData.caseInfo.caseManageDutyToken"
    otherName="caseManageDutyOther"
    v-model:other="apiData.caseInfo.caseManageDutyOther"
    :config="{
      select: {
        isToOption: true,
        options: options.manageDuty,
        placeholder: '請選擇管理時段',
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
