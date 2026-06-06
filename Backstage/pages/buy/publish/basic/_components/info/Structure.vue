<script setup>
const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)
</script>

<template>
  <PageBuyPublishBasicSelectInputOther
    selectName="caseStructureToken"
    v-model:select="apiData.caseInfo.caseStructureToken"
    otherName="caseStructureOther"
    v-model:other="apiData.caseInfo.caseStructureOther"
    :config="{
      select: {
        options: options.structure,
        placeholder: {
          value: '請選擇建物結構',
          isToOption: true,
        },
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
      required: '請選擇型態',
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
