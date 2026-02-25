<script setup>
import FormRadiosOval from '@components/buy/mForm/RadiosOval.vue'
import FormSelect from '@components/buy/mForm/Select.vue'
import FormInput from '@components/buy/mForm/Input.vue'

import RadiosOval from '@pages/buy/_container/RadiosOval.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { options, apiData } = storeToRefs(buyProject)

const isCaseZoingOtherShow = ref(false)
const onCaseZoingChange = () => {
  apiData.value.caseZoingTypeToken = ''
}
const onCaseZoingTypeChange = (props) => {
  const { text } = props

  isCaseZoingOtherShow.value = text === '其他'
}
</script>

<template>
  <RadiosOval>
    <FormRadiosOval
      name="caseZoingToken"
      v-model="apiData.caseZoingToken"
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
      <FormSelect
        name="caseZoingCity"
        v-model="apiData.caseZoingTypeToken"
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
          main: '--height-40 --px-12 --py-8 pt:flex-1',
        }"
        @change="onCaseZoingTypeChange"
        v-if="apiData.caseZoingToken === '1'"
      />
      <FormSelect
        name="caseZoingLand"
        v-model="apiData.caseZoingTypeToken"
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
          main: '--height-40 --px-12 --py-8 pt:flex-1',
        }"
        @change="onCaseZoingTypeChange"
        v-if="apiData.caseZoingToken === '2'"
      />
      <FormInput
        name="caseZoingTypeOther"
        v-model="apiData.caseZoingTypeOther"
        :config="{
          placeholder: '請填寫',
        }"
        :rules="{
          required: '請填寫',
        }"
        :setClass="{
          main: '--height-40 --px-12 --py-8 pt:flex-1',
        }"
        v-if="isCaseZoingOtherShow"
      />
    </div>
  </RadiosOval>
</template>

<style></style>
