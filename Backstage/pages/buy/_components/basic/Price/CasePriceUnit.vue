<script setup>
import FormInput from '@components/buy/mForm/Input.vue'
import FormCheckBox from '@components/buy/mForm/CheckBox.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { apiData } = storeToRefs(buyProject)
const isAutoCalc = ref(true)
</script>

<template>
  <ul class="flex flex-wrap tm:gap-x-[8px] p:gap-x-[24px]">
    <li>
      <FormInput
        name="casePriceUnit"
        v-model="apiData.casePriceUnit"
        :config="{
          inputMode: 'numeric',
          inputChinese: false,
          checkNotIsZero: true,
          comma: true,
          isDisabled: isAutoCalc,
        }"
        :setClass="{
          main: '--height-40 --px-12 --py-8 tm:w-[228px] p:w-[270px]',
          element: 'grow',
          rearAssist: 'text-[14px] text-[--gray-999]',
          suffix: 'text-[14px] text-[--gray-999]',
        }"
      >
        <template #rearAssist>萬 / 坪</template>
        <template #suffix>單價 = 總價 / 建物登記坪數</template>
      </FormInput>
    </li>
    <li class="flex h-[40px] items-center">
      <FormCheckBox
        name="isAutoCalc"
        v-model="isAutoCalc"
        :config="{
          label: '自動計算',
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
    <li class="flex h-[40px] items-center">
      <FormCheckBox
        name="isCasePricePerPinDeductParking"
        v-model="apiData.isCasePricePerPinDeductParking"
        :config="{
          label: '扣除車位價',
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
