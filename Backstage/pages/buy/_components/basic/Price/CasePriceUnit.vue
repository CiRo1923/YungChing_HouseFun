<script setup>
import FormInput from '@components/buy/mForm/Input.vue'
import FormCheckBox from '@components/buy/mForm/CheckBox.vue'

import { onToFixed } from '@js/_prototype.js'

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
  } = apiData.value.caseInfo
  if (isCasePriceUnitAuto && casePrice && caseBuildSqPin) {
    const price =
      isCasePriceIncludeParking && isCasePricePerPinDeductParking && caseParkingPrice
        ? Number(casePrice) - Number(caseParkingPrice)
        : Number(casePrice)
    const buildSq =
      isCaseBuildSqIncludeParking && caseParkingSqPin
        ? Number(caseBuildSqPin) - Number(caseParkingSqPin)
        : Number(caseBuildSqPin)

    apiData.value.caseInfo.casePriceUnit = Number(onToFixed(price / buildSq, 2))
  }
}

watch(
  () => [
    apiData.value.caseInfo.casePrice,
    apiData.value.caseInfo.caseBuildSqPin,
    apiData.value.caseInfo.caseParkingSqPin,
    apiData.value.caseInfo.isCasePriceIncludeParking,
    apiData.value.caseInfo.isCasePricePerPinDeductParking,
    apiData.value.caseInfo.isCaseBuildSqIncludeParking,
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
        v-model.number="apiData.caseInfo.casePriceUnit"
        :config="{
          inputMode: 'numeric',
          inputChinese: false,
          checkNotIsZero: true,
          comma: true,
          toFixed: 2,
          isDisabled: apiData.caseInfo.isCasePriceUnitAuto,
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
            v-model="apiData.caseInfo.isCasePriceUnitAuto"
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
            v-model="apiData.caseInfo.isCasePricePerPinDeductParking"
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
