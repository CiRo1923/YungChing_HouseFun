<script setup>
import FormInput from '@components/buy/mForm/Input.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyBasicStore } from '@stores/buy/basic.js'
import useStores from '@stores/buy/_composables/useStores.js'

const buyProject = useBuyProjectStore()
const buyBasic = useBuyBasicStore()
const { basic } = useStores()
const { apiData } = storeToRefs(buyProject)
const { pingData, pingUnitLabel } = storeToRefs(buyBasic)
</script>

<template>
  <FormInput
    name="caseMainSq"
    v-model="pingData.caseMainSq"
    :config="{
      inputMode: 'numeric',
      inputChinese: false,
      checkNotIsZero: true,
    }"
    :rules="{
      custom: {
        valid: basic.onPingVaild(),
        errorMessage: apiData.isCaseBuildSqIncludeParking
          ? '主建物坪數不得超過登記坪數 (含車位)'
          : '主建物坪數不得超過登記坪數',
      },
    }"
    :setClass="{
      main: '--h-40 --px-12 --py-8 p:w-[270px]',
      element: 'grow',
      rearAssist: 'text-[14px] text-[--gray-999]',
    }"
    @blur="basic.onPinSqMetersConvert('caseMainSq')"
  >
    <template #rearAssist>{{ pingUnitLabel }}</template>
  </FormInput>
</template>

<style></style>
