<script setup>
import { useBuyPublishStore } from '@stores/buy/publish.js'
import useBuyPublishActions from '~/stores/buy/composables/usePublishActions.js'

const buyPublish = useBuyPublishStore()
const { pingUnitLabel, onPinSqMetersConvert } = useBuyPublishActions()
const { pingData } = storeToRefs(buyPublish)
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
    @blur="onPinSqMetersConvert('caseParkingSq')"
  >
    <template #rearAssist>{{ pingUnitLabel }}</template>
  </BuyMFormInput>
</template>

<style></style>
