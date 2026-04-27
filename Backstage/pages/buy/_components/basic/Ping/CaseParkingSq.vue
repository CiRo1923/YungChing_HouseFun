<script setup>
import { useBuyBasicStore } from '@stores/buy/basic.js'
import useBuyBasicActions from '@stores/buy/_composables/useBasicActions.js'

const buyBasic = useBuyBasicStore()
const { pingUnitLabel, onPinSqMetersConvert } = useBuyBasicActions()
const { pingData } = storeToRefs(buyBasic)
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
      main: '--h-40 --px-12 --py-8 p:w-[270px]',
      element: 'grow',
      rearAssist: 'text-[14px] text-[--gray-999]',
    }"
    @blur="onPinSqMetersConvert('caseParkingSq')"
  >
    <template #rearAssist>{{ pingUnitLabel }}</template>
  </BuyMFormInput>
</template>

<style></style>
