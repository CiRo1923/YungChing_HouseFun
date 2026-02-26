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
  <ul class="flex flex-wrap tm:gap-x-[8px] p:gap-x-[24px]">
    <li>
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
        }"
        :setClass="{
          main: '--height-40 --px-12 --py-8 tm:w-[228px] p:w-[270px]',
          element: 'grow',
          rearAssist: 'text-[14px] text-[--gray-999]',
        }"
        @blur="basic.onPinSqMetersConvert('caseBuildSq')"
      >
        <template #rearAssist>{{ pingUnitLabel }}</template>
      </FormInput>
    </li>
    <li class="flex h-[40px] items-center">
      <FormCheckBox
        name="isCaseBuildSqIncludeParking"
        v-model="apiData.isCaseBuildSqIncludeParking"
        :config="{
          label: '含車位',
          value: {
            true: true,
            false: false,
          },
        }"
        :setClass="{
          label: 'text-[16px]',
        }"
      />
    </li>
  </ul>
</template>

<style></style>
