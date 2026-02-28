<script setup>
import FormInput from '@components/buy/mForm/Input.vue'
import FormCheckBox from '@components/buy/mForm/CheckBox.vue'

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
  <ul class="flex overflow-hidden tm:gap-x-[16px] p:gap-x-[24px]">
    <li class="m:min-w-0 m:grow t:w-[220px] p:w-[270px]">
      <FormInput
        name="caseBuildSq"
        v-model="pingData.caseBuildSq"
        :config="{
          inputMode: 'numeric',
          inputChinese: false,
          checkNotIsZero: true,
        }"
        :rules="{
          required: '請輸入登記坪數',
          custom: {
            valid: basic.onPingVaild(),
            errorMessage: apiData.isCaseBuildSqIncludeParking
              ? '登記坪數 (含車位) 不得小於主建物坪數'
              : '登記坪數不得小於主建物坪數',
          },
        }"
        :setClass="{
          main: '--h-40 --px-12 --py-8',
          element: 'grow',
          rearAssist: 'text-[14px] text-[--gray-999]',
        }"
        @blur="basic.onPinSqMetersConvert('caseBuildSq')"
      >
        <template #rearAssist>{{ pingUnitLabel }}</template>
      </FormInput>
    </li>
    <li class="flex h-[40px] items-center m:shrink-0">
      <FormCheckBox
        name="isCaseBuildSqIncludeParking"
        v-model="apiData.isCaseBuildSqIncludeParking"
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
