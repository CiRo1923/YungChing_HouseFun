<script setup>
import FormInput from '@components/buy/mForm/Input.vue'

import { useBuyBasicStore } from '@stores/buy/basic.js'
import useBuyProjectActions from '@stores/buy/_composables/useProjectActions.js'

const buyBasic = useBuyBasicStore()
const { basic } = useBuyProjectActions()
const { pingData } = storeToRefs(buyBasic)
</script>

<template>
  <FormInput
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
    @blur="basic.onPinSqMetersConvert('caseParkingSq')"
  >
    <template #rearAssist>{{ basic.pingUnitLabel }}</template>
  </FormInput>
</template>

<style></style>
