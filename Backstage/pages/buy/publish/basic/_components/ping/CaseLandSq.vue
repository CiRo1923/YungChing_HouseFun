<script setup>
const buyPublish = useBuyPublishStore()
const { pingUnitLabel, onPinSqMetersConvert } = useBuyPublishActions()
const { pingData } = storeToRefs(buyPublish)
</script>

<template>
  <CommonMFormInput
    name="caseLandSq"
    v-model.number="pingData.caseLandSq"
    :config="{
      inputMode: 'numeric',
      inputChinese: false,
      checkNotIsZero: true,
      maxlength: 5,
      toFixed: 2,
      comma: true,
    }"
    :setClass="{
      type: 'text-[16px]',
      main: '--h-40 --px-12 --py-8 t:w-[220px] p:w-[270px]',
      element: 'grow',
      rearAssist: 'text-[14px] text-[--gray-999]',
    }"
    @blur="onPinSqMetersConvert('caseLandSq')"
  >
    <template #rearAssist>{{ pingUnitLabel }}</template>
  </CommonMFormInput>
</template>

<style></style>
