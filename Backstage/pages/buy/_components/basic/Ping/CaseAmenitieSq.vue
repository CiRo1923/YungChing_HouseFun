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
</script>

<template>
  <ul class="m:space-y-[12px] t:gap-x-[8px] pt:flex pt:flex-wrap p:gap-x-[24px]">
    <li>
      <ul class="m:space-y-[12px] pt:flex pt:gap-x-[8px]">
        <li class="t:w-[228px] p:w-[270px]">
          <FormInput
            name="caseAmenitieSq"
            v-model="pingData.caseAmenitieSq"
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
            @blur="basic.onPinSqMetersConvert('caseAmenitieSq')"
          >
            <template #rearAssist>{{ basic.pingUnitLabel }}</template>
          </FormInput>
        </li>
        <li class="t:w-[228px] p:w-[270px]">
          <FormInput
            name="caseAmenitieSqRqtio"
            v-model="apiData.caseAmenitieSqRqtio"
            :config="{
              placeholder: '公設比',
              inputMode: 'numeric',
              inputChinese: false,
              checkNotIsZero: true,
              isDisabled: apiData.isCaseAmenitieSqRqtioAuto,
            }"
            :setClass="{
              main: '--h-40 --px-12 --py-8',
              element: 'grow',
              rearAssist: 'text-[14px] text-[--gray-999]',
            }"
          >
            <template #rearAssist>%</template>
          </FormInput>
        </li>
      </ul>
    </li>
    <li class="flex items-center pt:h-[40px]">
      <FormCheckBox
        name="isCaseAmenitieSqRqtioAuto"
        v-model="apiData.isCaseAmenitieSqRqtioAuto"
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
