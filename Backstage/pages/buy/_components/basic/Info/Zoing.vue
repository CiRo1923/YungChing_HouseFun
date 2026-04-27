<script setup>
import RadiosOval from '@pages/buy/_containers/RadiosOval.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyBasicStore } from '@stores/buy/basic.js'

const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const buyBasic = useBuyBasicStore()
const { apiData } = storeToRefs(buyBasic)

const isCaseZoingOtherShow = ref(false)
const onCaseZoingChange = () => {
  apiData.value.caseInfo.caseZoingTypeToken = null
}
const onCaseZoingTypeChange = (props) => {
  const { text } = props

  isCaseZoingOtherShow.value = text === '其他'
}
</script>

<template>
  <RadiosOval>
    <BuyMFormRadiosOval
      name="caseZoingToken"
      v-model.number="apiData.caseInfo.caseZoingToken"
      :options="options.caseZoing"
      :config="{
        schema: {
          label: 'text',
          value: 'code',
        },
      }"
      :setClass="{
        radios: 'm:w-full',
        container: 'm:flex-1',
      }"
      @change="onCaseZoingChange"
    />
    <div class="m:space-y-[12px] pt:flex pt:gap-x-[8px]">
      <BuyMFormSelect
        name="caseZoingCity"
        v-model.number="apiData.caseInfo.caseZoingTypeToken"
        :options="options.zoingCity"
        :config="{
          placeholder: '請選擇都市土地',
          schema: {
            label: 'text',
            value: 'value',
          },
        }"
        :rules="{
          required: '請選擇都市土地',
        }"
        :setClass="{
          main: '--h-40 --px-12 --py-8 pt:flex-1',
        }"
        @change="onCaseZoingTypeChange"
        v-if="apiData.caseInfo.caseZoingToken === 1"
      />
      <BuyMFormSelect
        name="caseZoingLand"
        v-model.number="apiData.caseInfo.caseZoingTypeToken"
        :options="options.zoingLand"
        :config="{
          placeholder: '請選擇非都市土地',
          schema: {
            label: 'text',
            value: 'value',
          },
        }"
        :rules="{
          required: '請選擇非都市土地',
        }"
        :setClass="{
          main: '--h-40 --px-12 --py-8 pt:flex-1',
        }"
        @change="onCaseZoingTypeChange"
        v-if="apiData.caseInfo.caseZoingToken === 2"
      />
      <BuyMFormInput
        name="caseZoingTypeOther"
        v-model="apiData.caseInfo.caseZoingTypeOther"
        :config="{
          placeholder: '請填寫',
        }"
        :rules="{
          required: '請填寫',
        }"
        :setClass="{
          main: '--h-40 --px-12 --py-8 pt:flex-1',
        }"
        v-if="isCaseZoingOtherShow"
      />
    </div>
  </RadiosOval>
</template>

<style></style>
