<script setup>
import FormInput from '@components/buy/mForm/Input.vue'

import { useBuyBasicStore } from '@stores/buy/basic.js'
import useStores from '@stores/buy/_composables/useStores.js'

const buyBasic = useBuyBasicStore()
const { basic } = useStores()
const { pingData, pingUnitLabel } = storeToRefs(buyBasic)
</script>

<template>
  <ul class="flex flex-wrap tm:gap-x-[8px] p:gap-x-[24px]">
    <li>
      <FormInput
        name="caseParkingSq"
        v-model="pingData.caseParkingSq"
        :config="{
          inputMode: 'numeric',
          inputChinese: false,
          checkNotIsZero: true,
        }"
        :setClass="{
          main: '--height-40 --px-12 --py-8 p:w-[270px]',
          element: 'grow',
          rearAssist: 'text-[14px] text-[--gray-999]',
        }"
        @blur="basic.onPinSqMetersConvert('caseParkingSq')"
      >
        <template #rearAssist>{{ pingUnitLabel }}</template>
      </FormInput>
    </li>
  </ul>
</template>

<style></style>
