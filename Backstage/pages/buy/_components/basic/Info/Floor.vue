<script setup>
import RadiosOval from '@pages/buy/_containers/RadiosOval.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyBasicStore } from '@stores/buy/basic.js'

const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const buyBasic = useBuyBasicStore()
const { apiData } = storeToRefs(buyBasic)
const radioOptions = readonly([
  {
    label: '單層',
    value: true,
  },
  {
    label: '多層',
    value: false,
  },
])

const onIsSingleFloorChange = () => {
  apiData.value.caseInfo.floorToToken = 1
  apiData.value.caseInfo.caseFloorTo = null
}
</script>

<template>
  <RadiosOval>
    <BuyMFormRadiosOval
      name="isSingleFloor"
      v-model="apiData.caseInfo.isSingleFloor"
      :options="radioOptions"
      :setClass="{
        radios: 'm:w-full',
        container: 'm:flex-1',
      }"
      @change="onIsSingleFloorChange"
    />
    <ul class="pt:flex pt:gap-x-[8px]">
      <li class="pt:flex pt:grow pt:gap-x-[8px]">
        <BuyMFormSelect
          name="floorFromToken"
          v-model.number="apiData.caseInfo.floorFromToken"
          :options="options.floor"
          :config="{
            placeholder: '請選擇',
            schema: {
              label: 'text',
              value: 'value',
            },
          }"
          :setClass="{
            main: '--h-40 --px-12 --py-8 pt:shrink-0',
          }"
        />
        <BuyMFormInput
          name="caseFloorFrom"
          v-model.number="apiData.caseInfo.caseFloorFrom"
          :config="{
            inputMode: 'numeric',
            inputChinese: false,
            checkNotIsZero: true,
            integer: true,
            isExistClose: false,
          }"
          :rules="{
            required: '請輸入樓層',
          }"
          :setClass="{
            main: '--h-40 --px-12 --py-8 p:grow',
            element: 'grow',
            rearAssist: 'text-[14px] text-[--gray-999]',
          }"
        >
          <template #rearAssist>樓</template>
        </BuyMFormInput>
      </li>
      <li class="pt:shrink-0" v-if="!apiData.caseInfo.isSingleFloor">
        <span class="text-[--gray-666] pt:flex pt:items-center p:h-[40px] p:text-[16px]">~</span>
      </li>
      <li class="pt:flex pt:grow pt:gap-x-[8px]" v-if="!apiData.caseInfo.isSingleFloor">
        <BuyMFormSelect
          name="floorToToken"
          v-model.number="apiData.caseInfo.floorToToken"
          :options="options.floor"
          :config="{
            placeholder: '請選擇',
            schema: {
              label: 'text',
              value: 'value',
            },
          }"
          :setClass="{
            main: '--h-40 --px-12 --py-8 pt:shrink-0',
          }"
        />
        <BuyMFormInput
          name="caseFloorTo"
          v-model.number="apiData.caseInfo.caseFloorTo"
          :config="{
            inputMode: 'numeric',
            inputChinese: false,
            checkNotIsZero: true,
            integer: true,
            isExistClose: false,
          }"
          :rules="{
            required: '請輸入樓層',
          }"
          :setClass="{
            main: '--h-40 --px-12 --py-8 pt:grow',
            element: 'grow',
            rearAssist: 'text-[14px] text-[--gray-999]',
          }"
        >
          <template #rearAssist>樓</template>
        </BuyMFormInput>
      </li>
    </ul>
  </RadiosOval>
</template>

<style></style>
