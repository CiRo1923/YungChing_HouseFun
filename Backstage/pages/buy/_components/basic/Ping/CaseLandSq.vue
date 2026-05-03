<script setup>
import { useBuyBasicStore } from '@stores/buy/basic.js'
import useBuyBasicActions from '@stores/buy/composables/useBasicActions.js'

const buyBasic = useBuyBasicStore()
const { pingUnitLabel, onPinSqMetersConvert } = useBuyBasicActions()
const { pingData } = storeToRefs(buyBasic)
</script>

<template>
  <BuyMFormInput
    name="caseLandSq"
    v-model.number="pingData.caseLandSq"
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
    @blur="onPinSqMetersConvert('caseLandSq')"
  >
    <template #rearAssist>{{ pingUnitLabel }}</template>
  </BuyMFormInput>
</template>

<style></style>
