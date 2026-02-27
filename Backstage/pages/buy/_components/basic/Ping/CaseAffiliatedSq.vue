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
const items = shallowReadonly([
  {
    id: 'caseBalconySq',
    label: '陽台',
  },
  {
    id: 'casePlatformSq',
    label: '平台',
  },
  {
    id: 'caseTerraceSq',
    label: '露臺',
  },
  {
    id: 'caseStairwellSq',
    label: '電 / 樓梯間',
  },
  {
    id: 'caseMezzanineSq',
    label: '夾層',
  },
  {
    id: 'caseBasementSq',
    label: '地下室',
  },
  {
    id: 'caseOtherSq',
    label: '其他',
  },
])
</script>

<template>
  <div class="m:space-y-[16px] pt:space-y-[8px]">
    <ul class="flex flex-wrap tm:gap-x-[8px] p:gap-x-[24px]">
      <li>
        <FormInput
          name="caseAffiliatedSqPin"
          v-model="pingData.caseAffiliatedSq"
          :config="{
            inputMode: 'numeric',
            inputChinese: false,
            checkNotIsZero: true,
          }"
          :rules="{
            required: '請輸入登記坪數',
          }"
          :setClass="{
            main: '--height-40 --px-12 --py-8 tm:w-[228px] pt:w-[270px]',
            element: 'grow',
            rearAssist: 'text-[14px] text-[--gray-999]',
          }"
          @blur="basic.onPinSqMetersConvert('caseAffiliatedSq')"
        >
          <template #rearAssist>{{ pingUnitLabel }}</template>
        </FormInput>
      </li>
      <li class="flex h-[40px] items-center">
        <FormCheckBox
          name="isCaseBuildSqIncludeParking"
          v-model="apiData.isCaseAttachedSqAutoCalculate"
          :config="{
            label: '自動加總',
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
    <ul
      class="grid rounded-[15px] bg-[--gray-f7] m:grid-cols-2 tm:gap-x-[16px] tm:gap-y-[24px] tm:p-[24px] pt:grid-cols-4 p:gap-x-[24px] p:gap-y-[8px] p:p-[30px]"
    >
      <li
        class="m:space-y-[12px] pt:flex pt:gap-x-[8px]"
        v-for="(item, index) in items"
        :key="`${item.id}_${index}`"
      >
        <span
          class="text-[16px] leading-[1.2] text-[--gray-666] pt:flex pt:h-[40px] pt:min-w-[48px] pt:shrink-0 pt:items-center"
          v-html="item.label"
        />
        <FormInput
          :name="item.id"
          v-model="pingData[item.id]"
          :config="{
            inputMode: 'numeric',
            inputChinese: false,
            checkNotIsZero: true,
            isExistClose: false,
          }"
          :setClass="{
            main: '--height-40 --px-12 --py-8 pt:grow',
            element: 'grow',
            rearAssist: 'text-[14px] text-[--gray-999]',
          }"
          @blur="basic.onPinSqMetersConvert(item.id)"
        >
          <template #rearAssist>{{ pingUnitLabel }}</template>
        </FormInput>
      </li>
    </ul>
  </div>
</template>

<style></style>
