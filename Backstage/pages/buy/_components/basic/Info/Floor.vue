<script setup>
import FormRadiosOval from '@components/buy/mForm/RadiosOval.vue'
import FormSelect from '@components/buy/mForm/Select.vue'
import FormInput from '@components/buy/mForm/Input.vue'

import RadiosOval from '@pages/buy/_containers/RadiosOval.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { options, apiData } = storeToRefs(buyProject)
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
  apiData.value.floorToToken = '1'
  apiData.value.caseFloorTo = ''
}
</script>

<template>
  <RadiosOval>
    <FormRadiosOval
      name="isSingleFloor"
      v-model="apiData.isSingleFloor"
      :options="radioOptions"
      :setClass="{
        radios: 'm:w-full',
        container: 'm:flex-1',
      }"
      @change="onIsSingleFloorChange"
    />
    <ul class="pt:flex pt:gap-x-[8px]">
      <li class="pt:flex pt:grow pt:gap-x-[8px]">
        <FormSelect
          name="floorFromToken"
          v-model="apiData.floorFromToken"
          :options="options.floor"
          :config="{
            placeholder: '請選擇',
            schema: {
              label: 'text',
              value: 'value',
            },
          }"
          :rules="{
            required: '請選擇出售樓層',
          }"
          :setClass="{
            main: '--h-40 --px-12 --py-8 pt:shrink-0',
          }"
        />
        <FormInput
          name="caseFloorFrom"
          v-model="apiData.caseFloorFrom"
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
        </FormInput>
      </li>
      <li class="pt:shrink-0" v-if="!apiData.isSingleFloor">
        <span class="text-[--gray-666] pt:flex pt:items-center p:h-[40px] p:text-[16px]">~</span>
      </li>
      <li class="pt:flex pt:grow pt:gap-x-[8px]" v-if="!apiData.isSingleFloor">
        <FormSelect
          name="floorToToken"
          v-model="apiData.floorToToken"
          :options="options.floor"
          :config="{
            placeholder: '請選擇',
            schema: {
              label: 'text',
              value: 'value',
            },
          }"
          :rules="{
            required: '請選擇出售樓層',
          }"
          :setClass="{
            main: '--h-40 --px-12 --py-8 pt:shrink-0',
          }"
        />
        <FormInput
          name="caseFloorTo"
          v-model="apiData.caseFloorTo"
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
        </FormInput>
      </li>
    </ul>
  </RadiosOval>
</template>

<style></style>
