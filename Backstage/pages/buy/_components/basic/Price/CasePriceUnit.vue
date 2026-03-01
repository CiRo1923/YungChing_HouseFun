<script setup>
import FormInput from '@components/buy/mForm/Input.vue'
import FormCheckBox from '@components/buy/mForm/CheckBox.vue'

import { toFixed } from '@js/_prototype.js'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { apiData } = storeToRefs(buyProject)

const onIsCasePriceUnitAuto = () => {
  const {
    isCasePriceUnitAuto, // 自動計算
    casePrice, // 總價
    caseParkingPrice, // 車位價
    caseBuildSqPin, // 登記坪數
    caseParkingSqPin, // 車位坪數
    isCasePriceIncludeParking, // 總價含車位
    isCasePricePerPinDeductParking, // 扣除車位價
    isCaseBuildSqIncludeParking, // 登記坪數含車位
  } = apiData.value
  if (isCasePriceUnitAuto && casePrice && caseBuildSqPin) {
    const price =
      isCasePriceIncludeParking && isCasePricePerPinDeductParking && caseParkingPrice
        ? Number(casePrice) - Number(caseParkingPrice)
        : Number(casePrice)
    const buildSq =
      isCaseBuildSqIncludeParking && caseParkingSqPin
        ? Number(caseBuildSqPin) - Number(caseParkingSqPin)
        : Number(caseBuildSqPin)

    apiData.value.casePriceUnit = Number(toFixed(price / buildSq, 2))
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
    onIsCasePriceUnitAuto()
  }
)
</script>

<template>
  <ul class="flex flex-wrap tm:gap-x-[8px] p:gap-x-[24px]">
    <li>
      <FormInput
        name="casePriceUnit"
        v-model.number="apiData.casePriceUnit"
        :config="{
          inputMode: 'numeric',
          inputChinese: false,
          checkNotIsZero: true,
          comma: true,
          toFixed: 2,
          isDisabled: apiData.isCasePriceUnitAuto,
        }"
        :setClass="{
          main: '--h-40 --px-12 --py-8 p:w-[270px]',
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
      <ul class="flex tm:gap-x-[16px] p:gap-x-[24px]">
        <li class="flex h-[40px] items-center">
          <FormCheckBox
            name="isCasePriceUnitAuto"
            v-model="apiData.isCasePriceUnitAuto"
            :config="{
              mode: 'boolean',
              label: '自動計算',
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
              mode: 'boolean',
              label: '扣除車位價',
            }"
            :setClass="{
              label: 'text-[16px]',
            }"
          />
        </li>
      </ul>
    </li>
  </ul>
</template>

<style></style>
