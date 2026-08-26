<script setup>
const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)

// const onIsCaseAddtionChange = () => {
//   if (!apiData.value.caseInfo.isCaseAddtion) {
//     apiData.value.caseInfo.caseAddRoom = ''
//     apiData.value.caseInfo.caseAddLivingRoom = ''
//     apiData.value.caseInfo.caseAddBathroom = ''
//     apiData.value.caseInfo.caseAddBalcony = ''
//   }
// }

// 填了車位價就視為有車位,與車位坪數(ping/CaseParkingSq.vue)的行為一致。
// 這兩個欄位是「輸入來源」而不是被 isCaseParking 控制的結果,所以不鎖輸入、改為反推。
const onParkingPriceBlur = () => {
  if (!apiData.value.caseInfo.caseParkingPrice) return

  apiData.value.caseInfo.isCaseParking = true
}
</script>

<template>
  <CommonMFormInput
    name="caseParkingPrice"
    v-model.number="apiData.caseInfo.caseParkingPrice"
    :config="{
      inputMode: 'numeric',
      inputChinese: false,
      checkNotIsZero: true,
      comma: true,
    }"
    :setClass="{
      main: '--h-40 --px-12 --py-8 t:w-[220px] p:w-[270px]',
      element: 'grow',
      rearAssist: 'text-[14px] text-[--gray-999]',
    }"
    @blur="onParkingPriceBlur"
  >
    <template #rearAssist>萬</template>
  </CommonMFormInput>
</template>

<style></style>
