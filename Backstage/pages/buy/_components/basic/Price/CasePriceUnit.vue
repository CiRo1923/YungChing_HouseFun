<script setup>
import FormInput from '@components/buy/mForm/Input.vue'
import FormCheckBox from '@components/buy/mForm/CheckBox.vue'

import { toFixed } from '@js/_prototype.js'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { apiData } = storeToRefs(buyProject)
const isAutoCalc = ref(true)

const onIsAutoCalc = () => {
  const {
    casePrice, // 寵價
    caseParkingPrice, // 車位價
    caseBuildSqPin, // 登記坪數
    caseParkingSqPin, // 車位坪數
    isCasePriceIncludeParking, // 總價含車位
    isCasePricePerPinDeductParking, // 扣除車位價
    isCaseBuildSqIncludeParking, // 登記坪數含車位
  } = apiData.value
  if (isAutoCalc.value && casePrice && caseBuildSqPin) {
    const price =
      isCasePriceIncludeParking && isCasePricePerPinDeductParking && caseParkingPrice
        ? Number(casePrice) - Number(caseParkingPrice)
        : Number(casePrice)
    const buildSq =
      isCaseBuildSqIncludeParking && caseParkingSqPin
        ? Number(caseBuildSqPin) - Number(caseParkingSqPin)
        : Number(caseBuildSqPin)

    apiData.value.casePriceUnit = toFixed(price / buildSq, 2)
  }
}

watch(
  () => [
    apiData.value.casePrice,
    apiData.value.caseBuildSqPin,
    apiData.value.caseParkingSqPin,
    apiData.value.isCasePriceIncludeParking,
    apiData.value.isCasePricePerPinDeductParking,
    apiData.value.isCaseBuildSqIncludeParking,
  ],
  () => {
    onIsAutoCalc()
  }
)
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
          toFixed: 2,
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
