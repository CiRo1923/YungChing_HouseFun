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
const { pingData } = storeToRefs(buyBasic)
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
    class: 'm:col-span-2',
  },
])

watch(
  () => [
    apiData.value.isCaseAttachedSqAutoCalculate,
    pingData.value.caseBalconySq,
    pingData.value.casePlatformSq,
    pingData.value.caseTerraceSq,
    pingData.value.caseStairwellSq,
    pingData.value.caseMezzanineSq,
    pingData.value.caseBasementSq,
    pingData.value.caseOtherSq,
  ],
  () => {
    const { isCaseAttachedSqAutoCalculate } = apiData.value
    const {
      caseBalconySq,
      casePlatformSq,
      caseTerraceSq,
      caseStairwellSq,
      caseMezzanineSq,
      caseBasementSq,
      caseOtherSq,
    } = pingData.value

    if (isCaseAttachedSqAutoCalculate) {
      const caseBalconySqNumber = caseBalconySq ? Number(caseBalconySq) : 0
      const casePlatformSqNumber = casePlatformSq ? Number(casePlatformSq) : 0
      const caseTerraceSqNumber = caseTerraceSq ? Number(caseTerraceSq) : 0
      const caseStairwellSqNumber = caseStairwellSq ? Number(caseStairwellSq) : 0
      const caseMezzanineSqNumber = caseMezzanineSq ? Number(caseMezzanineSq) : 0
      const caseBasementSqNumber = caseBasementSq ? Number(caseBasementSq) : 0
      const caseOtherSqNumber = caseOtherSq ? Number(caseOtherSq) : 0
      const total =
        caseBalconySqNumber +
        casePlatformSqNumber +
        caseTerraceSqNumber +
        caseStairwellSqNumber +
        caseMezzanineSqNumber +
        caseBasementSqNumber +
        caseOtherSqNumber

      pingData.value.caseAffiliatedSq = total || null
    }
  }
)
</script>

<template>
  <div class="m:space-y-[16px] pt:space-y-[8px]">
    <ul class="flex overflow-hidden tm:gap-x-[16px] p:gap-x-[24px]">
      <li class="m:min-w-0 m:grow t:w-[220px] pt:w-[270px]">
        <FormInput
          name="caseAffiliatedSqPin"
          v-model.number="pingData.caseAffiliatedSq"
          :config="{
            inputMode: 'numeric',
            inputChinese: false,
            checkNotIsZero: true,
            isDisabled: apiData.isCaseAttachedSqAutoCalculate,
          }"
          :setClass="{
            main: '--h-40 --px-12 --py-8',
            element: 'grow',
            rearAssist: 'text-[14px] text-[--gray-999]',
          }"
          @blur="basic.onPinSqMetersConvert('caseAffiliatedSq')"
        >
          <template #rearAssist>{{ basic.pingUnitLabel }}</template>
        </FormInput>
      </li>
      <li class="flex h-[40px] items-center m:shrink-0">
        <FormCheckBox
          name="isCaseAttachedSqAutoCalculate"
          v-model="apiData.isCaseAttachedSqAutoCalculate"
          :config="{
            mode: 'boolean',
            label: '自動加總',
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
        :class="item.class"
        v-for="(item, index) in items"
        :key="`${item.id}_${index}`"
      >
        <span
          class="text-[16px] leading-[1.2] text-[--gray-666] pt:flex pt:h-[40px] pt:min-w-[48px] pt:shrink-0 pt:items-center"
          v-html="item.label"
        />
        <FormInput
          :name="item.id"
          v-model.number="pingData[item.id]"
          :config="{
            inputMode: 'numeric',
            inputChinese: false,
            checkNotIsZero: true,
            isExistClose: false,
          }"
          :setClass="{
            main: '--h-40 --px-12 --py-8 pt:grow',
            element: 'grow',
            rearAssist: 'text-[14px] text-[--gray-999]',
          }"
          @blur="basic.onPinSqMetersConvert(item.id)"
        >
          <template #rearAssist>{{ basic.pingUnitLabel }}</template>
        </FormInput>
      </li>
    </ul>
  </div>
</template>

<style></style>
