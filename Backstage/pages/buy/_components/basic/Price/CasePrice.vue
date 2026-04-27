<script setup>
import { useBuyBasicStore } from '@stores/buy/basic.js'

const buyBasic = useBuyBasicStore()
const { apiData } = storeToRefs(buyBasic)

// const onIsCaseAddtionChange = () => {
//   if (!apiData.value.caseInfo.isCaseAddtion) {
//     apiData.value.caseInfo.caseAddRoom = ''
//     apiData.value.caseInfo.caseAddLivingRoom = ''
//     apiData.value.caseInfo.caseAddBathroom = ''
//     apiData.value.caseInfo.caseAddBalcony = ''
//   }
// }
</script>

<template>
  <ul class="flex flex-wrap tm:gap-x-[8px] p:gap-x-[24px]">
    <li class="tm:w-[228px] p:w-[270px]">
      <BuyMFormInput
        name="casePrice"
        v-model.number="apiData.caseInfo.casePrice"
        :config="{
          inputMode: 'numeric',
          inputChinese: false,
          checkNotIsZero: true,
          comma: true,
        }"
        :rules="{
          required: '請輸入總價',
        }"
        :setClass="{
          main: '--h-40 --px-12 --py-8',
          element: 'grow',
          rearAssist: 'text-[14px] text-[--gray-999]',
        }"
      >
        <template #rearAssist>萬</template>
      </BuyMFormInput>
    </li>
    <li class="flex h-[40px] items-center">
      <BuyMFormCheckBox
        name="isCasePriceIncludeParking"
        v-model="apiData.caseInfo.isCasePriceIncludeParking"
        :config="{
          mode: 'boolean',
          label: '含車位',
        }"
        :setClass="{
          label: 'text-[16px]',
        }"
      />
    </li>
  </ul>
</template>

<style></style>
