<script setup>
const buyPublish = useBuyPublishStore()
const { pingUnitLabel, onPinSqMetersConvert } = useBuyPublishActions()
const { apiData, pingData } = storeToRefs(buyPublish)

const onParkingSqBlur = () => {
  onPinSqMetersConvert('caseParkingSq')

  if (pingData.value.caseParkingSq) {
    apiData.value.caseInfo.isCaseParking = true
  }
}
</script>

<template>
  <BuyMFormInput
    name="caseParkingSq"
    v-model.number="pingData.caseParkingSq"
    :config="{
      inputMode: 'numeric',
      inputChinese: false,
      checkNotIsZero: true,
    }"
    :setClass="{
      main: '--h-40 --px-12 --py-8 t:w-[220px] p:w-[270px]',
      element: 'grow',
      rearAssist: 'text-[14px] text-[--gray-999]',
    }"
    @blur="onParkingSqBlur"
  >
    <template #rearAssist>{{ pingUnitLabel }}</template>
  </BuyMFormInput>
</template>

<style></style>
