<script setup>
const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)

const onCaseZoingChange = () => {
  apiData.value.caseInfo.caseZoingTypeToken = null
}
</script>

<template>
  <PageBuyPublishBasicRadiosOval>
    <BuyMFormRadiosOval
      name="caseZoingToken"
      v-model.number="apiData.caseInfo.caseZoingToken"
      :options="options.caseZoing"
      :config="{
        schema: {
          label: 'text',
          value: 'code',
        },
      }"
      :setClass="{
        radios: 'm:w-full',
        container: 'm:flex-1',
      }"
      @change="onCaseZoingChange"
    />
    <PageBuyPublishBasicSelectInputOther
      selectName="caseZoingTypeToken"
      v-model:select="apiData.caseInfo.caseZoingTypeToken"
      otherName="caseZoingTypeOther"
      v-model:other="apiData.caseInfo.caseZoingTypeOther"
      :config="{
        select: {
          options: options.zoingCity,
          placeholder: '請選擇都市土地',
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
        required: '請選擇都市土地',
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
      v-if="apiData.caseInfo.caseZoingToken === 1"
    />
    <PageBuyPublishBasicSelectInputOther
      selectName="caseZoingTypeToken"
      v-model:select="apiData.caseInfo.caseZoingTypeToken"
      otherName="caseZoingTypeOther"
      v-model:other="apiData.caseInfo.caseZoingTypeOther"
      :config="{
        select: {
          options: options.zoingLand,
          placeholder: '請選擇非都市土地',
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
        required: '請選擇非都市土地',
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
      v-if="apiData.caseInfo.caseZoingToken === 2"
    />
  </PageBuyPublishBasicRadiosOval>
</template>

<style></style>
