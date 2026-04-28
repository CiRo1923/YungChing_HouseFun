<script setup>
// import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyBasicStore } from '@stores/buy/basic.js'
import useBuyBasicActions from '@stores/buy/composables/useBasicActions.js'

// const buyProject = useBuyProjectStore()
// const { options } = storeToRefs(buyProject)
const buyBasic = useBuyBasicStore()
const { pingUnitLabel, onPingVaild, onPinSqMetersConvert } = useBuyBasicActions()
const { apiData, pingData } = storeToRefs(buyBasic)
</script>

<template>
  <BuyMFormInput
    name="caseMainSq"
    v-model.number="pingData.caseMainSq"
    :config="{
      inputMode: 'numeric',
      inputChinese: false,
      checkNotIsZero: true,
    }"
    :rules="{
      custom: {
        valid: onPingVaild(),
        errorMessage: apiData.caseInfo.isCaseBuildSqIncludeParking
          ? '主建物坪數不得超過登記坪數 (含車位)'
          : '主建物坪數不得超過登記坪數',
      },
    }"
    :setClass="{
      main: '--h-40 --px-12 --py-8 p:w-[270px]',
      element: 'grow',
      rearAssist: 'text-[14px] text-[--gray-999]',
    }"
    @blur="onPinSqMetersConvert('caseMainSq')"
  >
    <template #rearAssist>{{ pingUnitLabel }}</template>
  </BuyMFormInput>
</template>

<style></style>
