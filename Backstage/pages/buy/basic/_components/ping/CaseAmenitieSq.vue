<script setup>
// import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyBasicStore } from '@stores/buy/basic.js'
import useBuyBasicActions from '@stores/buy/composables/useBasicActions.js'

// const buyProject = useBuyProjectStore()
// const { options } = storeToRefs(buyProject)
const buyBasic = useBuyBasicStore()
const { pingUnitLabel, onPinSqMetersConvert } = useBuyBasicActions()
const { apiData, pingData } = storeToRefs(buyBasic)
</script>

<template>
  <ul class="m:space-y-[12px] t:gap-x-[8px] pt:flex pt:flex-wrap p:gap-x-[24px]">
    <li>
      <ul class="m:space-y-[12px] pt:flex pt:gap-x-[8px]">
        <li class="t:w-[220px] p:w-[270px]">
          <BuyMFormInput
            name="caseAmenitieSq"
            v-model.number="pingData.caseAmenitieSq"
            :config="{
              inputMode: 'numeric',
              inputChinese: false,
              checkNotIsZero: true,
            }"
            :setClass="{
              main: '--h-40 --px-12 --py-8',
              element: 'grow',
              rearAssist: 'text-[14px] text-[--gray-999]',
            }"
            @blur="onPinSqMetersConvert('caseAmenitieSq')"
          >
            <template #rearAssist>{{ pingUnitLabel }}</template>
          </BuyMFormInput>
        </li>
        <li class="t:w-[220px] p:w-[270px]">
          <BuyMFormInput
            name="caseAmenitieSqRqtio"
            v-model.number="apiData.caseInfo.caseAmenitieSqRqtio"
            :config="{
              placeholder: '公設比',
              inputMode: 'numeric',
              inputChinese: false,
              checkNotIsZero: true,
              isDisabled: apiData.caseInfo.isCaseAmenitieSqRqtioAuto,
            }"
            :setClass="{
              main: '--h-40 --px-12 --py-8',
              element: 'grow',
              rearAssist: 'text-[14px] text-[--gray-999]',
            }"
          >
            <template #rearAssist>%</template>
          </BuyMFormInput>
        </li>
      </ul>
    </li>
    <li class="flex items-center pt:h-[40px]">
      <BuyMFormCheckBox
        name="isCaseAmenitieSqRqtioAuto"
        v-model="apiData.caseInfo.isCaseAmenitieSqRqtioAuto"
        :config="{
          mode: 'boolean',
          label: '自動計算',
        }"
        :setClass="{
          label: 'text-[16px]',
        }"
      />
    </li>
  </ul>
</template>

<style></style>
